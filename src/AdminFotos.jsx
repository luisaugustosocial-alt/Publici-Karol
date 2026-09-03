import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { upload } from "@imagekit/javascript";
import { ArrowLeft, Upload } from "lucide-react";
import { auth, db } from "./firebase";

const PUBLIC_KEY="public_vwtlqICXUSxwYIQWMKmyE5pmV/Y=";

async function sendImage(file,folder){
  const response=await fetch("/api/imagekit-auth");
  const data=await response.json();
  if(!response.ok) throw new Error(data?.error||"Falha ao autorizar upload.");
  const result=await upload({file,fileName:`${Date.now()}-${file.name}`,folder,publicKey:data.publicKey||PUBLIC_KEY,token:data.token,signature:data.signature,expire:data.expire});
  return result.url;
}

export default function AdminFotos(){
  const [loading,setLoading]=useState(true),[authorized,setAuthorized]=useState(false),[site,setSite]=useState({heroImageUrl:"/brenda-alencar.png",aboutImageUrl:"/brenda-alencar.png"}),[uploading,setUploading]=useState("");
  useEffect(()=>onAuthStateChanged(auth,async user=>{
    if(!user){window.location.href="/admin";return}
    try{const adm=await getDoc(doc(db,"admins",user.uid)); if(!adm.exists()){window.location.href="/admin";return} setAuthorized(true); const snap=await getDoc(doc(db,"site","config")); if(snap.exists())setSite(v=>({...v,...snap.data()}));}finally{setLoading(false)}
  }),[]);
  async function change(key,file){if(!file)return;setUploading(key);try{const url=await sendImage(file,key==="heroImageUrl"?"/publici-karol/brenda/home":"/publici-karol/brenda/sobre");await setDoc(doc(db,"site","config"),{[key]:url},{merge:true});setSite(v=>({...v,[key]:url}));alert("Foto atualizada com sucesso.")}catch(e){alert(e.message||"Erro ao enviar foto.")}finally{setUploading("")}}
  if(loading)return <div className="admin-center">Carregando...</div>;
  if(!authorized)return null;
  return <div className="admin-photo-page"><div className="admin-photo-panel"><a className="back-site" href="/admin"><ArrowLeft size={17}/> Voltar ao painel</a><span className="eyebrow">IMAGENS DO SITE</span><h1>Fotos da Brenda</h1><p>Agora as duas fotos são independentes. Trocar uma não altera a outra.</p><div className="admin-photo-grid"><Photo title="Foto principal — Home" text="Aparece na primeira tela, ao lado do nome Brenda Alencar." src={site.heroImageUrl} busy={uploading==="heroImageUrl"} onChange={f=>change("heroImageUrl",f)}/><Photo title="Foto — Sobre mim" text="Aparece na seção Sobre mim. Escolha uma foto diferente da principal." src={site.aboutImageUrl} busy={uploading==="aboutImageUrl"} onChange={f=>change("aboutImageUrl",f)}/></div></div></div>
}
function Photo({title,text,src,busy,onChange}){return <article className="admin-photo-card"><img src={src||"/brenda-alencar.png"} alt={title}/><h2>{title}</h2><p>{text}</p><label className="admin-primary"><Upload size={16}/>{busy?"Enviando...":"Trocar foto"}<input hidden type="file" accept="image/*" disabled={busy} onChange={e=>onChange(e.target.files?.[0])}/></label></article>}
