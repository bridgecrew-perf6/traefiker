import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import DashboardTable from "../../components/dashboard/table/DashboardTable";
import Navbar from "../../components/navbar/Navbar";
import { resetServerContext } from "react-beautiful-dnd";
import FileEditorModal from "../../components/code-editor/FileEditorModal";
import { useRecoilValue } from "recoil";
import { isEditingFileState, loadingFlagsState } from "../../atoms/atoms";
import SpinnerModal from "../../components/loading/SpinnerModal";
import ServiceSettingsModal from "../../components/service-settings/ServiceSettingsModal";

const Dashboard: NextPage = () => {
    return (
        <div>
            <Head>
                <title>Traefiker</title>
                <meta
                    name="description"
                    content="Traefiker is a tool for managing Docker containers running on Traefik"
                />
                <link rel="icon" href="traefik-logo.png" />
            </Head>
            <nav>
                <Navbar />
            </nav>
            <main>
                <DashboardHeader />
                <div className="max-w-7xl mx-auto py-6 px-6 lg:px-8">
                    <div className="flex flex-col">
                        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div
                                className="
                        py-2
                        align-middle
                        inline-block
                        min-w-full
                        sm:px-6
                        lg:px-8
                    "
                            >
                                <div
                                    className="
                            shadow
                            overflow-hidden
                            border-b border-gray-200
                            rounded-lg
                        "
                                >
                                    <DashboardTable />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    resetServerContext();

    return { props: {} };
};
export default Dashboard;
