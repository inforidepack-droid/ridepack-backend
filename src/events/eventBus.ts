import { EventEmitter } from "node:events";

const eventBus = new EventEmitter();
eventBus.setMaxListeners(50);

export { eventBus };
