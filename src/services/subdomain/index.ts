// src/services/name/index.ts

export interface BlubRegisterSubdomainResponse {
  success: boolean;
  data?: {
    nameObjId: string | null;
  };
  error?: string;
  errors?: string[];
}

export class BlubSubdomain {
  private readonly apiUrl = "https://api.blubsui.com";

  /**
   * Registers a subdomain (e.g. jack.blub) for a given address
   * @param address Sui wallet address of the user
   * @param name Desired subdomain name (without .blub)
   */
  async registerSubdomain(
    address: string,
    name: string
  ): Promise<BlubRegisterSubdomainResponse> {
    try {
      const res = await fetch(`${this.apiUrl}/names`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address, name }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        errors: [err.message || "Unknown error during subdomain registration."],
      };
    }
  }

  // Get blub name by address

  // Set as default
}
