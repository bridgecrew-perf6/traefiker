import { TrashIcon } from "@heroicons/react/solid";
import { useEffect, useState } from "react";
import { Redirect } from "../../../types/Redirect";

function UrlRedirectsTableRow(props: {
    urlRedirect: Redirect;
    handleUpdateRedirect: (redirect: Redirect) => void;
    handleDeleteRedirect: (redirect: Redirect) => void;
}) {
    const [fromUrl, setFromUrl] = useState(props.urlRedirect.from);
    const [toUrl, setToUrl] = useState(props.urlRedirect.to);

    useEffect(() => {
        props.handleUpdateRedirect({
            ...props.urlRedirect,
            from: fromUrl,
            to: toUrl,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromUrl, toUrl]);

    return (
        <tr>
            <td className="px-4 py-1 text-md font-medium text-white tracking-wider border border-white-600 w-auto">
                <input
                    id="From Url"
                    type="text"
                    className="w-full bg-transparent outline-none border-b-2 border-white"
                    placeholder="From Url.."
                    value={fromUrl}
                    onChange={(e) => {
                        setFromUrl(e.target.value);
                    }}
                />
            </td>
            <td className="px-4 py-1  text-md font-medium text-white tracking-wider border border-white-600 w-auto">
                <input
                    id="To Url"
                    type="text"
                    className="w-full bg-transparent outline-none border-b-2 border-white"
                    placeholder="To Url.."
                    value={toUrl}
                    onChange={(e) => {
                        setToUrl(e.target.value);
                    }}
                />
            </td>
            <td className="px-4 py-1 text-center text-md font-medium text-white tracking-wider  ">
                <button
                    className="bg-transparent text-red-700 hover:text-red-400 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline "
                    onClick={() => {
                        props.handleDeleteRedirect(props.urlRedirect);
                    }}
                >
                    <TrashIcon className="w-7 h-7" />
                </button>
            </td>
        </tr>
    );
}

export default UrlRedirectsTableRow;
