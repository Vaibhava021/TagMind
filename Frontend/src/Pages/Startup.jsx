import { useEffect, useState } from "react";
import { ensureBackend } from "../api/startup";
import { useNavigation } from "../context/NavigationContext";

export default function Startup({ onReady }) {
    const { navigate } = useNavigation();
    const [title, setTitle] = useState("Starting Bookmark Companion");
    const [message, setMessage] = useState("Checking backend...");
    useEffect(() => {
        async function start() {
            try {
                await ensureBackend((status) => { 
                    setMessage(status);
                });
                onReady();
            }
            catch (error) {
                setTitle("Backend Timeout");
                setMessage(error.message);
            }
        }
        start();
    }, []);

    return (
        <div
            style={{
                width: "400px",
                minHeight: "600px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                padding: "20px",
                boxSizing: "border-box"
            }}
        >
            <h2>{title}</h2>
            <p>{message}</p>
        </div>
    );
}