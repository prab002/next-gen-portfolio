import React, { useState } from 'react';
import styles from '../styles/PortfolioTerminal.module.css';

export const QRGenerator = () => {
    const [input, setInput] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            // Using qrserver API for zero-dependency QR generation with futuristic styling
            // color=00ff00 (Neon Green), bgcolor=0a0a0a (Dark Background)
            setGeneratedUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(input)}&color=00ff00&bgcolor=0a0a0a&margin=2`);
        }
    };

    return (
        <div className={styles.qrContainer}>
            <div className={styles.qrHeader}>
                <span className={styles.qrTitle}>QUANTUM RESPONSE ENCODER</span>
                <span className={styles.qrStatus}>{generatedUrl ? 'ACTIVE' : 'STANDBY'}</span>
            </div>

            <div className={styles.qrContent}>
                <div className={styles.qrInputSection}>
                    <div className={styles.qrLabel}>INPUT DATA STREAM</div>
                    <form onSubmit={handleGenerate} style={{ width: '100%' }}>
                        <input
                            type="text"
                            className={styles.qrInput}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter text or URL to encode..."
                            autoFocus
                        />
                        <button type="submit" className={styles.qrButton}>
                            ENCODE
                        </button>
                    </form>
                    <div className={styles.qrHelp}>
                        Supported formats: URL, Text, Alpha-numeric
                    </div>
                </div>

                <div className={styles.qrPreviewSection}>
                    <div className={styles.qrFrame}>
                        {generatedUrl ? (
                            <img src={generatedUrl} alt="QR Code" className={styles.qrImage} />
                        ) : (
                            <div className={styles.qrPlaceholder}>
                                <span>AWAITING DATA</span>
                            </div>
                        )}
                        {/* Corner Accents */}
                        <div className={`${styles.qrCorner} ${styles.tl}`}></div>
                        <div className={`${styles.qrCorner} ${styles.tr}`}></div>
                        <div className={`${styles.qrCorner} ${styles.bl}`}></div>
                        <div className={`${styles.qrCorner} ${styles.br}`}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
