export default function server({ port, dist, host, }?: {
    port?: number | undefined;
    dist?: string | undefined;
    host?: string | boolean | undefined;
}): Promise<void>;
