import { Request, Response } from "express";
import {
    findAllServices,
    saveService,
    findServiceByName,
    deleteServiceByName,
} from "../services/services.service";
import { Service } from "../types/Service";
import { getOrCreateImageByImageIdentifier } from "../services/images.service";
import { Image } from "../types/Image";
import {
    createContainer,
    deleteContainer,
    startContainer,
    stopContainer,
} from "../../libs/docker";
import { ServiceStatus } from "../types/enums/ServiceStatus";
import Dockerode from "dockerode";
import { findLastUsedOrder } from "../services/services.service";
import logger from "../utils/logger";

export const getAllServicesHandler = async (
    _req: Request,
    res: Response<Service[]>
) => {
    const services: Service[] = await findAllServices();
    return res.json(services);
};

export const createServiceHandler = async (req: Request, res: Response) => {
    try {
        if (await findServiceByName(req.body.name)) {
            logger.error(`Service with name ${req.body.name} already exists`);
            return res.status(400).json({
                error: `Service with name ${req.body.name} already exists`,
            });
        }
        const image: Image = await getOrCreateImageByImageIdentifier(
            req.body.image
        );
        const service: Service = await saveService({
            name: req.body.name,
            status: ServiceStatus.PULLING,
            image: image,
            hosts: req.body.hosts,
            environmentVariables: [],
            redirects: [],
            order: (await findLastUsedOrder()) + 1, // TODO: operation is not atomic ?? might(is) a problem if multiple requests are made at the same time
        });
        createContainer(
            service,
            image,
            attachContainerToService,
            cleanUpOnError
        );
        logger.info(`Service ${service.name} created`);
        return res.json(service);
    } catch (e) {
        logger.error(e);
        return res.status(500).json({
            error: e,
        });
    }
};

export const updateServiceHandler = async (req: Request, res: Response) => {
    try {
        const hosts = req.body.hosts;
        const environmentVariables = req.body.environmentVariables;
        const redirects = req.body.redirects;
        if (!hosts && !environmentVariables && !redirects) {
            logger.error(`No changes to service ${req.body.name} requested`);
            return res.status(400).json({
                error: "Empty update request",
            });
        }

        const service: Service | null = await findServiceByName(
            req.params.name
        );
        if (!service) {
            logger.error(`Service ${req.params.name} not found`);
            return res.status(404).json({
                error: `Service with name ${req.body.name} not found`,
            });
        }
        if (service.status == ServiceStatus.PULLING) {
            logger.error(`Service ${req.params.name} is being pulled`);
            return res.status(400).json({
                error: `Service with name ${req.body.name} is still pulling`,
            });
        }

        service.hosts = hosts ?? service.hosts;
        service.environmentVariables =
            environmentVariables ?? service.environmentVariables;
        service.redirects = redirects ?? service.redirects;
        const image = service.image;
        await deleteContainer(service);
        await saveService(service);
        createContainer(
            service,
            image,
            attachContainerToService,
            cleanUpOnError
        );
        logger.info(`Service ${service.name} updated`);
        return res.json(service);
    } catch (e) {
        return res.status(500).json({
            error: e,
        });
    }
};

export const startServiceHandler = async (req: Request, res: Response) => {
    try {
        const service: Service | null = await findServiceByName(
            req.params.name
        );
        if (!service) {
            logger.error(`Service ${req.params.name} not found`);
            return res.status(404).json({
                error: `Service with name ${req.params.name} not found`,
            });
        }
        if (service.status == ServiceStatus.PULLING) {
            logger.error(`Service ${req.params.name} is being pulled`);
            return res.status(400).json({
                error: `Service with name ${req.params.name} is still pulling`,
            });
        }

        if (service.status == ServiceStatus.RUNNING) {
            logger.error(`Service ${req.params.name} is already running`);
            return res.status(400).json({
                error: `Service with name ${req.params.name} is already running`,
            });
        }
        if (service.status == ServiceStatus.ERROR) {
            logger.error(`Service ${req.params.name} is in error state`);
            return res.status(400).json({
                error: `Service with name ${req.params.name} is in error state`,
            });
        }
        await startContainer(service);
        service.status = ServiceStatus.RUNNING;
        const updatedService = await saveService(service);
        logger.info(`Service ${updatedService.name} started`);
        return res.json(updatedService);
    } catch (e) {
        return res.status(500).json({
            error: e,
        });
    }
};

export const stopServiceHandler = async (req: Request, res: Response) => {
    try {
        const service: Service | null = await findServiceByName(
            req.params.name
        );
        if (!service) {
            logger.error(`Service ${req.params.name} not found`);
            return res.status(404).json({
                error: `Service with name ${req.params.name} not found`,
            });
        }
        if (service.status == ServiceStatus.PULLING) {
            logger.error(`Service ${req.params.name} is being pulled`);
            return res.status(400).json({
                error: `Service with name ${req.params.name} is still pulling`,
            });
        }

        if (
            service.status == ServiceStatus.STOPPED ||
            service.status == ServiceStatus.CREATED
        ) {
            logger.error(`Service ${req.params.name} is already stopped`);
            return res.status(400).json({
                error: `Service with name ${req.params.name} is already stopped`,
            });
        }
        if (service.status == ServiceStatus.ERROR) {
            logger.error(`Service ${req.params.name} is in error state`);
            return res.status(400).json({
                error: `Service with name ${req.params.name} is in error state`,
            });
        }
        await stopContainer(service);
        service.status = ServiceStatus.STOPPED;
        const updatedService = await saveService(service);
        logger.info(`Service ${updatedService.name} stopped`);
        return res.json(updatedService);
    } catch (e) {
        return res.status(500).json({
            error: e,
        });
    }
};

export const deleteServiceHandler = async (req: Request, res: Response) => {
    try {
        const service: Service | null = await findServiceByName(
            req.params.name
        );
        if (!service) {
            logger.error(`Service ${req.params.name} not found`);
            return res.status(404).json({
                error: `Service with name ${req.params.name} not found`,
            });
        }
        if (service.status == ServiceStatus.PULLING) {
            logger.error(`Service ${req.params.name} is being pulled`);
            return res.status(400).json({
                error: `Service with name ${req.params.name} is still pulling`,
            });
        }

        await deleteContainer(service);
        await deleteServiceByName(service.name);
        logger.info(`Service ${service.name} deleted`);
        return res.sendStatus(200);
    } catch (e) {
        logger.error(e);
        return res.status(500).json({
            error: e,
        });
    }
};

const attachContainerToService = async (
    service: Service,
    container: Dockerode.Container
) => {
    const containerInfo = await container.inspect();
    service.network = containerInfo.HostConfig.NetworkMode;
    service.containerId = container.id;
    service.status = ServiceStatus.CREATED;
    await saveService(service);
    logger.info(
        `Container ${container.id} attached to service ${service.name}`
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanUpOnError = async (service: Service, error: any) => {
    service.status = ServiceStatus.ERROR;
    await saveService(service);
    logger.error(`Service ${service.name} in error state because of ${error}`);
};
