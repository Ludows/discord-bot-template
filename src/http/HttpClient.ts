import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { logger } from "../utils/logger";

export class HttpClient {
  protected client: AxiosInstance;
  protected baseURL: string;

  constructor(baseURL: string, config?: AxiosRequestConfig) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 5000,
      ...config,
    });

    this.client.interceptors.request.use((req) => {
      logger.info(`[HTTP] ${req.method?.toUpperCase()} ${req.url}`);
      return req;
    });

    this.client.interceptors.response.use(
      (res) => res,
      (error) => {
        const status = error.response ? error.response.status : "UNKNOWN";
        const url = error.config ? error.config.url : "UNKNOWN";
        logger.error(`[HTTP] ERROR ${status} on ${url}`, error.message);
        return Promise.reject(error);
      },
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.get<T>(url, config);
    return res.data;
  }

  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const res = await this.client.post<T>(url, data, config);
    return res.data;
  }

  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const res = await this.client.put<T>(url, data, config);
    return res.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await this.client.delete<T>(url, config);
    return res.data;
  }
}
