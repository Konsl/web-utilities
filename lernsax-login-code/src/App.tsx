import { useRef, useState } from "react";
import "./App.css";

type ResponseValue =
    | { type: "none" }
    | { type: "loading" }
    | { type: "error"; message: string }
    | { type: "success"; url: string; imageUrl: string };

async function performRequest(
    email: string,
    password: string
): Promise<ResponseValue> {
    const requestJson = [
        {
            jsonrpc: "2.0",
            method: "login",
            id: 1,
            params: {
                login: email,
                password: password,
            },
        },
        {
            jsonrpc: "2.0",
            method: "set_focus",
            id: 2,
            params: {
                object: "trusts",
            },
        },
        {
            jsonrpc: "2.0",
            method: "get_url_for_autologin",
            id: 2,
            params: {},
        },
        {
            jsonrpc: "2.0",
            method: "logout",
            id: 3,
            params: {},
        },
    ];

    const response = await fetch("https://www.lernsax.de/jsonrpc.php", {
        method: "POST",
        headers: {},
        body: JSON.stringify(requestJson),
        mode: "cors",
    });

    const responseJson: unknown = await response.json();

    if (
        !Array.isArray(responseJson) ||
        responseJson.length != 4 ||
        !(responseJson[0]?.result?.error || responseJson[2]?.result?.url)
    ) {
        return {
            type: "error",
            message: "Invalid response from server",
        };
    }

    if (responseJson[0].result?.error) {
        return {
            type: "error",
            message: `Error: ${responseJson[0].result.error}`,
        };
    }

    const url = responseJson[2].result.url;
    const imageUrl = new URL("https://www.lernsax.de/wws/992.php");
    imageUrl.searchParams.set("url", url);

    return {
        type: "success",
        url: url.toString(),
        imageUrl: imageUrl.toString(),
    };
}

function App() {
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const submitButtonRef = useRef<HTMLInputElement>(null);

    const [response, setResponse] = useState<ResponseValue>({ type: "none" });

    return (
        <>
            <h1>Lernsax QR Code Generator</h1>
            <form
                className="unstyled-form"
                onSubmit={(e) => {
                    e.preventDefault();

                    if (
                        !emailRef.current ||
                        !passwordRef.current ||
                        !submitButtonRef.current
                    )
                        return;

                    if (!emailRef.current.value.endsWith(".lernsax.de")) {
                        emailRef.current!.value += ".lernsax.de";
                    }

                    setResponse({ type: "loading" });
                    performRequest(
                        emailRef.current!.value,
                        passwordRef.current!.value
                    ).then((response) => {
                        setResponse(response);
                    });
                }}
            >
                <ul className="unstyled-list">
                    <li className="styled-input-container">
                        <label htmlFor="email">Email</label>
                        <input
                            ref={emailRef}
                            id="email"
                            name="email"
                            type="text"
                            autoComplete="off"
                            placeholder=" "
                            onKeyDown={(e) => {
                                if (e.key != "Enter") return;

                                e.preventDefault();
                                passwordRef.current?.focus();
                            }}
                        />
                    </li>
                    <li className="styled-input-container">
                        <label htmlFor="password">Password</label>
                        <input
                            ref={passwordRef}
                            id="password"
                            name="password"
                            type="password"
                            placeholder=" "
                            onKeyDown={(e) => {
                                if (e.key != "Enter") return;

                                e.preventDefault();
                                submitButtonRef.current?.click();
                            }}
                        />
                    </li>
                    <li>
                        <input
                            ref={submitButtonRef}
                            type="submit"
                            value="Create QR Code"
                        />
                    </li>
                </ul>
            </form>
            {
                response.type == "loading" ? (
                    <p>Loading...</p>
                ) : response.type == "error" ? (
                    <p>{response.message}</p>
                ) : response.type == "success" ? (
                    <a href={response.url} target="_blank" rel="noreferrer">
                        <img
                            className="qr-image"
                            src={response.imageUrl}
                            alt="QR Code"
                        />
                    </a>
                ) : null // response.type == "none"
            }
        </>
    );
}

export default App;
