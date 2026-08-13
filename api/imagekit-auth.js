import ImageKit from "@imagekit/nodejs";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    if (!privateKey) {
      return res.status(500).json({
        error: "IMAGEKIT_PRIVATE_KEY não configurada na Vercel"
      });
    }

    const client = new ImageKit({
      privateKey: privateKey
    });

    const { token, expire, signature } =
      client.helper.getAuthenticationParameters();

    return res.status(200).json({
      token,
      expire,
      signature,
      publicKey: "public_vwtlqICXUSxwYIQWMKmyE5pmV/Y="
    });

  } catch (error) {
    console.error("Erro ImageKit:", error);

    return res.status(500).json({
      error: error?.message || "Erro interno do ImageKit"
    });
  }
}
