
declare namespace NodeJS {
    interface ProcessEnv {
      DB_URL: string;
      PORT: string;
      EMAIL: string;
      PASSWORD: string;
      JWT_KEY: string;
      CLOUD_NAME: string;
      CLOUD_APIKEY: string;
      CLOUD_APISECRET: string;
    }
  }
  