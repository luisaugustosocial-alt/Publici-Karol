import ImageKit from "@imagekit/nodejs";

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return Response.json(
        { error: "Método não permitido." },
        { status: 405 }
      );
    }

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    if (!privateKey) {
      return Response.json(
        { error: "IMAGEKIT_PRIVATE_KEY não configurada na Vercel." },
        { status: 500 }
      );
    }

    try {
      const client = new ImageKit({
        privateKey,
      });

      const { token, expire, signature } =
        client.helper.getAuthenticationParameters();

      return Response.json(
        {
          token,
          expire,
          signature,
          publicKey: "public_vwtlqICXUSxwYIQWMKmyE5pmV/Y=",
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    } catch (error) {
      console.error("ImageKit auth error:", error);

      return Response.json(
        {
          error: "Falha ao gerar autenticação do ImageKit.",
        },
        {
          status: 500,
        }
      );
    }
  },
};
