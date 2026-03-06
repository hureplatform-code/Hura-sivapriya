import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for managing system-wide inactivity lock.
 * SRS Requirement: 90s warning, 120s automatic lock.
 */
export function useInactivityTimer() {
    const { currentUser, logout } = useAuth();
    const [isWarning, setIsWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30); // 30 seconds countdown during warning
    const timerRef = useRef(null);
    const warningRef = useRef(null);

    const WARNING_LIMIT = 90 * 1000; // 90 seconds
    const LOCK_LIMIT = 120 * 1000;   // 120 seconds total

    const resetTimer = () => {
        setIsWarning(false);
        setTimeLeft(30);
        
        if (timerRef.current) clearTimeout(timerRef.current);
        if (warningRef.current) clearInterval(warningRef.current);

        if (currentUser) {
            timerRef.current = setTimeout(() => {
                setIsWarning(true);
                startWarningCountdown();
            }, WARNING_LIMIT);
        }
    };

    const startWarningCountdown = () => {
        let count = 30;
        warningRef.current = setInterval(() => {
            count -= 1;
            setTimeLeft(count);
            if (count <= 0) {
                clearInterval(warningRef.current);
                logout();
            }
        }, 1000);
    };

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        const handleActivity = () => {
            if (!isWarning) {
                resetTimer();
            }
        };

        if (currentUser) {
            resetTimer();
            events.forEach(event => document.addEventListener(event, handleActivity));
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (warningRef.current) clearInterval(warningRef.current);
            events.forEach(event => document.removeEventListener(event, handleActivity));
        };
    }, [currentUser, isWarning]);

    return { isWarning, timeLeft, resetTimer };
}
