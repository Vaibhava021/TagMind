import { useEffect, useState } from "react";
import { ensureBackend } from "../api/startup";
import { useNavigation } from "../context/NavigationContext";

const RETRY_DELAY = 3000;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default function Startup({ onReady }) {
    const { navigate } = useNavigation();

    const [title, setTitle] = useState("Starting TagMind");
    const [message, setMessage] = useState("Checking backend...");
    const [isErrorState, setIsErrorState] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function start() {
            while (!cancelled) {
                try {
                    setTitle("Starting TagMind");
                    setIsErrorState(false);

                    await ensureBackend(status => {
                        if (!cancelled) {
                            setMessage(status);
                        }
                    });

                    if (cancelled) return;

                    onReady();
                    return;
                } catch (error) {
                    if (cancelled) return;

                    console.error("Backend startup check failed:", error);

                    setTitle("Backend Not Ready");
                    setIsErrorState(true);
                    setMessage(
                        "Waiting for the backend. Retrying automatically in 3 seconds..."
                    );

                    await sleep(RETRY_DELAY);
                }
            }
        }

        start();

        return () => {
            cancelled = true;
        };
    }, [onReady]);

    return (
        <div style={styles.container}>
            {/* Embedded keyframe animations for the loading spinner */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulseGlow {
                    0%, 100% { opacity: 0.4; transform: scale(0.95); }
                    50% { opacity: 0.9; transform: scale(1.05); }
                }
            `}</style>

            {/* Ambient background accent orbs using your brand colors */}
            <div style={styles.glowOrbBlue} />
            <div style={styles.glowOrbPink} />

            <div style={styles.card}>
                {/* Spinner / Status Indicator */}
                <div style={styles.loaderContainer}>
                    <div 
                        style={{
                            ...styles.spinner,
                            borderTopColor: isErrorState ? '#db00b6' : '#0496ff',
                            borderRightColor: isErrorState ? '#0580fb' : '#db00b6',
                        }} 
                    />
                    <div 
                        style={{
                            ...styles.innerDot,
                            backgroundColor: isErrorState ? '#db00b6' : '#0496ff',
                            boxShadow: isErrorState ? '0 0 12px #db00b6' : '0 0 12px #0496ff'
                        }} 
                    />
                </div>

                {/* Text Content */}
                <div style={styles.textWrapper}>
                    <h2 
                        style={{
                            ...styles.title,
                            color: isErrorState ? '#db00b6' : '#ffffff'
                        }}
                    >
                        {title}
                    </h2>
                    <p style={styles.message}>{message}</p>
                </div>

                {/* Connection Status Pill */}
                <div style={styles.statusBar}>
                    <div 
                        style={{
                            ...styles.statusIndicator,
                            backgroundColor: isErrorState ? '#db00b6' : '#0496ff',
                            boxShadow: isErrorState ? '0 0 8px #db00b6' : '0 0 8px #0496ff'
                        }} 
                    />
                    <span style={styles.statusLabel}>
                        {isErrorState ? 'Attempting Reconnection' : 'System Booting'}
                    </span>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        width: "400px",
        minHeight: "600px",
        backgroundColor: "#111111",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: "24px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    glowOrbBlue: {
        position: "absolute",
        top: "-60px",
        left: "-60px",
        width: "220px",
        height: "220px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(4, 150, 255, 0.15) 0%, rgba(17, 17, 17, 0) 70%)",
        zIndex: 1,
        pointerEvents: "none",
    },
    glowOrbPink: {
        position: "absolute",
        bottom: "-60px",
        right: "-60px",
        width: "220px",
        height: "220px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(219, 0, 182, 0.12) 0%, rgba(17, 17, 17, 0) 70%)",
        zIndex: 1,
        pointerEvents: "none",
    },
    card: {
        backgroundColor: "#262624",
        width: "100%",
        borderRadius: "16px",
        padding: "40px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        boxShadow: "0 16px 48px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        zIndex: 2,
        boxSizing: "border-box",
    },
    loaderContainer: {
        position: "relative",
        width: "76px",
        height: "76px",
        marginBottom: "30px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    spinner: {
        width: "100%",
        height: "100%",
        border: "3px solid rgba(255, 255, 255, 0.06)",
        borderRadius: "50%",
        animation: "spin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite",
        position: "absolute",
    },
    innerDot: {
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        animation: "pulseGlow 2s ease-in-out infinite",
    },
    textWrapper: {
        marginBottom: "32px",
        width: "100%",
    },
    title: {
        fontSize: "20px",
        fontWeight: "700",
        margin: "0 0 10px 0",
        letterSpacing: "-0.3px",
        transition: "color 0.3s ease",
    },
    message: {
        fontSize: "13px",
        color: "#a0a0a0",
        margin: "0",
        lineHeight: "1.5",
        padding: "0 10px",
    },
    statusBar: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "rgba(17, 17, 17, 0.55)",
        padding: "8px 16px",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.04)",
    },
    statusIndicator: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
    },
    statusLabel: {
        fontSize: "11px",
        fontWeight: "500",
        color: "#b0b0b0",
        letterSpacing: "0.2px",
    },
};