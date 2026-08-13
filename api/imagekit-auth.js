import crypto from "node:crypto";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método não permitido."
    });
  }

  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    if (!privateKey) {
      return res.status(500).json({
        error: "IMAGEKIT_PRIVATE_KEY não configurada na Vercel."
      });
    }

    const token = crypto.randomUUID();

    const expire =
      Math.floor(Date.now() / 1000) + 2400;

    const signature = crypto
      .createHmac("sha1", privateKey.trim())
      .update(token + expire)
      .digest("hex");

    return res.status(200).json({
      token,
      expire,
      signature,
      publicKey: "public_vwtlqICXUSxwYIQWMKmyE5pmV/Y="
    });

  } catch (error) {
    console.error("Erro ImageKit:", error);

    return res.status(500).json({
      error: error?.message || "Erro ao gerar autenticação."
    });
  }
}
