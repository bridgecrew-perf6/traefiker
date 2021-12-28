import { NextApiRequest, NextApiResponse } from "next/types";
import * as docker from "../../../lib/docker";

const handler = (req: NextApiRequest, res: NextApiResponse) => {
    const { method } = req;
    if (method === "GET") {
        return res.status(200).json(docker.getAllServices());
    } else if (method === "POST") {
        const { name, image, hosts, order } = req.body;
        const _service = docker.createService(name, image, hosts, order);
        docker.saveService(name, _service);
        if (process.env.NODE_ENV === "production") {
            docker.launchDockerCompose(() => {
                res.status(200).json(_service);
            });
        } else {
            setTimeout(() => {
                res.status(200).json(_service);
            }, 5000);
        }
    }
};

export default handler;
