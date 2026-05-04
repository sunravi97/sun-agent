

export enum StopReason {
    FINISH = 'finish',
    MAX_TOKEN = 'max_token',
    TOOL_REQUESTED = 'tool_requested',
    STREAM = 'stream',
    CONTENT_BLOCKED = 'content_blocked'
}