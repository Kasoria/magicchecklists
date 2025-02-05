import { PriorityManager } from './mcl-priority-manager.js';
import { CountdownManager } from './mcl-countdown-manager.js';
import { MCLDraggable } from './mcl-draggable.js';

export { PriorityManager, CountdownManager, MCLDraggable};

// Export the convenience method
export const createManagers = (drawer) => ({
    priority: new PriorityManager(drawer),
    countdown: new CountdownManager(drawer),
    draggable: new MCLDraggable(drawer)
});