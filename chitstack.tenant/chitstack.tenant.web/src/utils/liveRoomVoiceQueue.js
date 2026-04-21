import api from '../api/axios';

const MAX_QUEUE_LENGTH = 8;

const PRIORITY_SCORE = {
    high: 2,
    medium: 1,
    low: 0
};

export class LiveRoomVoiceQueue {
    constructor({ auctionId, getLanguageCode, getEnabled, onUserGestureRequired = null, onVoiceUnlocked = null }) {
        this.auctionId = auctionId;
        this.getLanguageCode = getLanguageCode;
        this.getEnabled = getEnabled;
        this.onUserGestureRequired = onUserGestureRequired;
        this.onVoiceUnlocked = onVoiceUnlocked;
        this.queue = [];
        this.isProcessing = false;
        this.currentAudio = null;
        this.destroyed = false;
        this.userInteracted = false;
        this.awaitingUserGesture = false;
    }

    enqueue({ eventType, text, priority = 'medium', coalesceKey = null }) {
        if (!text || this.destroyed) {
            return;
        }

        if (coalesceKey) {
            const existingIndex = this.queue.findIndex(item => item.coalesceKey === coalesceKey);
            if (existingIndex >= 0) {
                this.queue[existingIndex] = { eventType, text, priority, coalesceKey };
            } else {
                this.queue.push({ eventType, text, priority, coalesceKey });
            }
        } else {
            this.queue.push({ eventType, text, priority, coalesceKey });
        }

        if (this.queue.length > MAX_QUEUE_LENGTH) {
            const firstLowPriorityIndex = this.queue.findIndex(item => item.priority === 'low');
            if (firstLowPriorityIndex >= 0) {
                this.queue.splice(firstLowPriorityIndex, 1);
            } else {
                this.queue.shift();
            }
        }

        if (!this.isProcessing && this.getEnabled()) {
            setTimeout(() => this.processNext(), 0);
        }
    }

    clear() {
        this.queue = [];
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
    }

    destroy() {
        this.destroyed = true;
        this.clear();
    }

    setUserInteracted() {
        const wasLocked = this.awaitingUserGesture;
        this.userInteracted = true;
        this.awaitingUserGesture = false;
        if (wasLocked && typeof this.onVoiceUnlocked === 'function') {
            this.onVoiceUnlocked();
        }
        if (!this.isProcessing && this.queue.length > 0) {
            setTimeout(() => this.processNext(), 0);
        }
    }

    pickNextItem() {
        if (this.queue.length === 0) {
            return null;
        }

        let bestIndex = 0;
        let bestScore = PRIORITY_SCORE[this.queue[0].priority] ?? 0;

        for (let i = 1; i < this.queue.length; i += 1) {
            const score = PRIORITY_SCORE[this.queue[i].priority] ?? 0;
            if (score > bestScore) {
                bestScore = score;
                bestIndex = i;
            }
        }

        return this.queue.splice(bestIndex, 1)[0];
    }

    async processNext() {
        if (this.destroyed || this.isProcessing || !this.getEnabled()) {
            return;
        }

        const nextItem = this.pickNextItem();
        if (!nextItem) {
            return;
        }

        this.isProcessing = true;
        try {
            const response = await api.post('/voice/synthesize', {
                auctionId: Number(this.auctionId),
                eventType: nextItem.eventType,
                text: nextItem.text,
                languageCode: this.getLanguageCode()
            }, {
                responseType: 'blob',
                timeout: 8000
            });

            if (!this.getEnabled()) {
                return;
            }

            const blob = response.data;
            await this.playBlob(blob);
        } catch (error) {
            const needsGesture =
                error?.code === 'USER_GESTURE_REQUIRED' ||
                error?.name === 'NotAllowedError' ||
                error?.message?.includes?.('play() failed because the user');

            if (needsGesture) {
                this.awaitingUserGesture = true;
                this.queue.unshift(nextItem);
                if (typeof this.onUserGestureRequired === 'function') {
                    this.onUserGestureRequired();
                }
                console.info('Live room TTS is waiting for first user interaction.');
                return;
            }

            // TTS failures are non-blocking for live room operation.
            // Keep minimal diagnostics for troubleshooting environment issues.
            console.warn('Live room TTS synthesis failed', error);
        } finally {
            this.isProcessing = false;
            if (!this.destroyed && this.queue.length > 0 && !this.awaitingUserGesture) {
                setTimeout(() => this.processNext(), 0);
            }
        }
    }

    playBlob(blob) {
        return new Promise((resolve, reject) => {
            if (!this.userInteracted) {
                const error = new Error('User gesture required before audio playback.');
                error.code = 'USER_GESTURE_REQUIRED';
                reject(error);
                return;
            }

            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            this.currentAudio = audio;

            const cleanup = () => {
                URL.revokeObjectURL(url);
                if (this.currentAudio === audio) {
                    this.currentAudio = null;
                }
                resolve();
            };

            audio.onended = cleanup;
            audio.onerror = cleanup;
            audio.play().catch(cleanup);
        });
    }
}
