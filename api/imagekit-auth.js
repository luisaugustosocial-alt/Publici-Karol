import ImageKit from "imagekit";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método não permitido."
    });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!privateKey) {
    return res.status(500).json({
      error: "IMAGEKIT_PRIVATE_KEY não configurada na Vercel."
    });
  }

  try {
    const imagekit = new ImageKit({
      publicKey: "public_vwtlqICXUSxwYIQWMKmyE5pmV/Y=",
      privateKey: privateKey,
      urlEndpoint: "https://ik.imagekit.io/7opliey78"
    });

    const authenticationParameters =
      imagekit.getAuthenticationParameters();

    return res.status(200).json({
      token: authenticationParameters.token,
      expire: authenticationParameters.expire,
      signature: authenticationParameters.signature,
      publicKey: "public_vwtlqICXUSxwYIQWMKmyE5pmV/Y="
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Falha ao gerar autenticação do ImageKit."
    });
  }
}
