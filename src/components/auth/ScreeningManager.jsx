import { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

const ScreeningManager = () => {
    const { user, logout } = useAuth();
    const lastHiddenAt = useRef(null);

    useEffect(() => {
        if (!user || !user.screening_duration) {
            return;
        }

        const screeningDurationMs = user.screening_duration * 60 * 1000;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // User navigated away
                lastHiddenAt.current = Date.now();
                localStorage.setItem('screening_hidden_at', lastHiddenAt.current.toString());
            } else if (document.visibilityState === 'visible') {
                // User came back
                const hiddenAt = lastHiddenAt.current || parseInt(localStorage.getItem('screening_hidden_at') || '0');
                
                if (hiddenAt && (Date.now() - hiddenAt > screeningDurationMs)) {
                    logout();
                    localStorage.removeItem('screening_hidden_at');
                } else {
                    // Reset if within duration or not hidden before
                    lastHiddenAt.current = null;
                    localStorage.removeItem('screening_hidden_at');
                }
            }
        };

        // Condition 2: Close tab auto-logout
        const handleUnload = (event) => {
            // We clear auth on unload if screening is active.
            // Note: This will also trigger on REFRESH.
            // Distinguishing refresh from close is not robust in JS, 
            // but usually auto-logout-on-close implies a high security session.
            localStorage.removeItem('auth');
            localStorage.removeItem('screening_hidden_at');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleUnload);

        // Periodical check for "Condition 3" (if user not in screen then logout)
        // If we strictly interpret "if not in screen then logout" as instant, 
        // we could just logout when hidden. But Condition 1 gives a duration.
        // So we interpret Condition 3 as "keep checking while hidden".
        const interval = setInterval(() => {
            if (document.visibilityState === 'hidden' && lastHiddenAt.current) {
                if (Date.now() - lastHiddenAt.current > screeningDurationMs) {
                    logout();
                    clearInterval(interval);
                }
            }
        }, 10000); // Check every 10s

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleUnload);
            clearInterval(interval);
        };
    }, [user, logout]);

    return null;
};

export default ScreeningManager;
