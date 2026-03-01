'use client';

import { useEffect, useRef } from 'react';

export default function ViewTracker({ id }: { id: string }) {
    const tracked = useRef(false);

    useEffect(() => {
        if (tracked.current) return;
        tracked.current = true;

        fetch(`/api/view/${id}`, { method: 'POST' }).catch(console.error);
    }, [id]);

    return null;
}
