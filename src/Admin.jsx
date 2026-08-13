import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { upload } from "@imagekit/javascript";
import {
  BarChart3,
  BriefcaseBusiness,
  Calculator,
  Contact,
  Eye,
  EyeOff,
  Home,
  Images,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquareQuote,
  Plus,
  Save,
  Settings,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { auth, db } from "./firebase";

const IMAGEKIT_PUBLIC_KEY = "public_vwtlqICXUSxwYIQWMKmyE5pmV/Y=";

const DEFAULT_SITE = {
  servicesVisible: true,
  portfolioVisible: true,
  feedbacksVisible: true,

  navSobre: "Sobre",
  navTrabalhos: "Trabalhos",
  navPortfolio: "Portfólio",
  navFeedbacks: "Feedbacks",
  navOrcamento: "Orçamento",
  navContato: "Contato",

  heroEyebrow: "SOCIAL MEDIA • CONTEÚDO • ESTRATÉGIA",
  heroNome: "Brenda",
  heroSobrenome: "Alencar",
  heroProfissao: "Social Media & Criadora de Conteúdo",
  heroDescricao:
    "Transformo ideias em conteúdo com identidade, estratégia e propósito para marcas que querem ser lembradas.",
  heroBotao: "Conheça meu trabalho",
  heroCardLinha1: "Estratégia + criatividade",
  heroCardLinha2: "para comunicar melhor.",

  sobreEyebrow: "SOBRE MIM",
  sobreTitulo: "Comunicação que aproxima marcas e pessoas.",
  sobreTexto1:
    "Sou Brenda Alencar, estudante de Publicidade e Propaganda, Social Media e criadora de conteúdo. Trabalho unindo criatividade e planejamento para construir uma presença digital coerente e marcante.",
  sobreTexto2:
    "Atuo com gestão de Instagram, criação de artes e vídeos, planejamento e produção de conteúdo.",

  trabalhosEyebrow: "O QUE EU FAÇO",
  trabalhosTitulo: "Meus trabalhos",
  trabalhosDescricao:
    "Soluções criativas pensadas para fortalecer sua comunicação digital.",

  portfolioEyebrow: "PORTFÓLIO",
  portfolioTitulo: "Projetos que contam histórias.",
  portfolioDescricao:
    "Uma seleção de trabalhos desenvolvidos com estratégia, criatividade e identidade.",

  feedbacksEyebrow: "FEEDBACKS",
  feedbacksTitulo: "O que dizem sobre meu trabalho",
  feedbacksDescricao:
    "Experiências de pessoas e marcas que já trabalharam comigo.",

  orcamentoEyebrow: "ORÇAMENTO",
  orcamentoTitulo: "Vamos transformar suas ideias em conteúdo?",
  orcamentoDescricao:
    "Selecione os serviços para receber uma estimativa inicial.",
  orcamentoBotao: "Enviar pelo WhatsApp",
  orcamentoPersonalizado: "Prefiro um orçamento personalizado",
  orcamentoAviso:
    "O valor exibido é uma estimativa e pode variar conforme a demanda.",

  contatoEyebrow: "CONTATO",
  contatoTitulo: "Vamos criar juntos?",
  contatoDescricao: "Entre em contato e me conte sobre sua ideia.",
  instagramTexto: "Instagram",
  instagramUrl: "",
  whatsappTexto: "WhatsApp",
  emailTexto: "E-mail",
  email: "",

  rodapeTexto: "Social Media & Criadora de Conteúdo",
};

const PAGES = [
  ["dashboard", "Visão geral", BarChart3],
  ["home", "Home", Home],
  ["sobre", "Sobre mim", UserRound],
  ["servicos", "Serviços", BriefcaseBusiness],
  ["portfolio", "Portfólio", Images],
  ["feedbacks", "Feedbacks", MessageSquareQuote],
  ["orcamento", "Orçamento", Calculator],
  ["contato", "Contato", Contact],
  ["config", "Configurações", Settings],
];

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function payload(item) {
  const data = { ...item };
  delete data.id;
  return data;
}

async function uploadImage(file, folder) {
  if (!file) return null;

  const authResponse = await fetch("/api/imagekit-auth");
  const authData = await authResponse.json();

  if (!authResponse.ok) {
    throw new Error(authData?.error || "Não foi possível autorizar o upload.");
  }

  const result = await upload({
    file,
    fileName: `${Date.now()}-${file.name}`,
    folder,
    publicKey: authData.publicKey || IMAGEKIT_PUBLIC_KEY,
    token: authData.token,
    signature: authData.signature,
    expire: authData.expire,
  });

  return {
    imageUrl: result.url,
    imageFileId: result.fileId,
  };
}

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [active, setActive] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [site, setSite] = useState(DEFAULT_SITE);
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    imageFileId: "",
    visible: true,
  });

  const [newProject, setNewProject] = useState({
    title: "",
    category: "",
    description: "",
    imageUrl: "",
    imageFileId: "",
    visible: true,
  });

  const [newFeedback, setNewFeedback] = useState({
    name: "",
    role: "",
    text: "",
    visible: true,
  });

  const [savingSite, setSavingSite] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "admins", currentUser.uid));
        setAuthorized(snapshot.exists());
      } catch (error) {
        console.error(error);
        setAuthorized(false);
      }

      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (authorized) loadEverything();
  }, [authorized]);

  async function loadEverything() {
    try {
      const [siteSnap, servicesSnap, portfolioSnap, feedbacksSnap, budgetsSnap] =
        await Promise.all([
          getDoc(doc(db, "site", "config")),
          getDocs(collection(db, "services")),
          getDocs(collection(db, "portfolio")),
          getDocs(collection(db, "feedbacks")),
          getDocs(collection(db, "orcamentos")),
        ]);

      setSite(
        siteSnap.exists()
          ? { ...DEFAULT_SITE, ...siteSnap.data() }
          : DEFAULT_SITE
      );

      setServices(
        servicesSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );

      setProjects(
        portfolioSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );

      setFeedbacks(
        feedbacksSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );

      setBudgets(
        budgetsSnap.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .sort(
            (a, b) =>
              (b.createdAt?.seconds || 0) -
              (a.createdAt?.seconds || 0)
          )
      );
    } catch (error) {
      console.error(error);
      alert("Não foi possível carregar todos os dados do painel.");
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");

    try {
      await signInWithEmailAndPassword(
        auth,
        login.email.trim(),
        login.password
      );
    } catch {
      setLoginError("E-mail ou senha incorretos.");
    }
  }

  async function saveSite() {
    setSavingSite(true);

    try {
      await setDoc(doc(db, "site", "config"), site, { merge: true });
      alert("Alterações salvas.");
    } catch (error) {
      console.error(error);
      alert("Não foi possível salvar.");
    } finally {
      setSavingSite(false);
    }
  }

  function textField(key, label, multiline = false) {
    return (
      <label className="admin-field">
        <span>{label}</span>
        {multiline ? (
          <textarea
            value={site[key] ?? ""}
            onChange={(event) =>
              setSite({ ...site, [key]: event.target.value })
            }
          />
        ) : (
          <input
            value={site[key] ?? ""}
            onChange={(event) =>
              setSite({ ...site, [key]: event.target.value })
            }
          />
        )}
      </label>
    );
  }

  async function changeSectionVisibility(key) {
    const value = site[key] === false;
    const next = { ...site, [key]: value };
    setSite(next);

    try {
      await setDoc(
        doc(db, "site", "config"),
        { [key]: value },
        { merge: true }
      );
    } catch (error) {
      console.error(error);
      alert("Não foi possível alterar a visibilidade.");
    }
  }

  async function setItemImage(kind, index, file, isNew = false) {
    if (!file) return;

    const key = `${kind}-${isNew ? "new" : index}`;
    setUploadingKey(key);

    try {
      const image = await uploadImage(
        file,
        kind === "portfolio"
          ? "/publici-karol/portfolio"
          : "/publici-karol/servicos"
      );

      if (!image) return;

      if (kind === "portfolio") {
        if (isNew) {
          setNewProject((current) => ({ ...current, ...image }));
        } else {
          setProjects((current) =>
            current.map((item, position) =>
              position === index ? { ...item, ...image } : item
            )
          );
        }
      } else {
        if (isNew) {
          setNewService((current) => ({ ...current, ...image }));
        } else {
          setServices((current) =>
            current.map((item, position) =>
              position === index ? { ...item, ...image } : item
            )
          );
        }
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Falha no upload da imagem.");
    } finally {
      setUploadingKey("");
    }
  }

  async function addService() {
    if (!newService.name.trim()) {
      alert("Informe o nome do serviço.");
      return;
    }

    const data = {
      ...newService,
      price: Number(newService.price || 0),
      createdAt: serverTimestamp(),
    };

    const reference = await addDoc(collection(db, "services"), data);

    setServices((current) => [
      ...current,
      { id: reference.id, ...newService, price: Number(newService.price || 0) },
    ]);

    setNewService({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      imageFileId: "",
      visible: true,
    });
  }

  async function saveService(item) {
    await updateDoc(doc(db, "services", item.id), {
      ...payload(item),
      price: Number(item.price || 0),
    });
    alert("Serviço salvo.");
  }

  async function deleteService(id) {
    if (!confirm("Deseja excluir este serviço?")) return;
    await deleteDoc(doc(db, "services", id));
    setServices((current) => current.filter((item) => item.id !== id));
  }

  async function toggleService(item) {
    const visible = item.visible === false;
    await updateDoc(doc(db, "services", item.id), { visible });
    setServices((current) =>
      current.map((service) =>
        service.id === item.id ? { ...service, visible } : service
      )
    );
  }

  async function addProject() {
    if (!newProject.title.trim()) {
      alert("Informe o título do projeto.");
      return;
    }

    const data = {
      ...newProject,
      createdAt: serverTimestamp(),
    };

    const reference = await addDoc(collection(db, "portfolio"), data);

    setProjects((current) => [
      ...current,
      { id: reference.id, ...newProject },
    ]);

    setNewProject({
      title: "",
      category: "",
      description: "",
      imageUrl: "",
      imageFileId: "",
      visible: true,
    });
  }

  async function saveProject(item) {
    await updateDoc(doc(db, "portfolio", item.id), payload(item));
    alert("Projeto salvo.");
  }

  async function deleteProject(id) {
    if (!confirm("Deseja excluir este projeto?")) return;
    await deleteDoc(doc(db, "portfolio", id));
    setProjects((current) => current.filter((item) => item.id !== id));
  }

  async function toggleProject(item) {
    const visible = item.visible === false;
    await updateDoc(doc(db, "portfolio", item.id), { visible });
    setProjects((current) =>
      current.map((project) =>
        project.id === item.id ? { ...project, visible } : project
      )
    );
  }

  async function addFeedback() {
    if (!newFeedback.text.trim()) {
      alert("Digite o feedback.");
      return;
    }

    const reference = await addDoc(collection(db, "feedbacks"), {
      ...newFeedback,
      createdAt: serverTimestamp(),
    });

    setFeedbacks((current) => [
      ...current,
      { id: reference.id, ...newFeedback },
    ]);

    setNewFeedback({
      name: "",
      role: "",
      text: "",
      visible: true,
    });
  }

  async function saveFeedback(item) {
    await updateDoc(doc(db, "feedbacks", item.id), payload(item));
    alert("Feedback salvo.");
  }

  async function deleteFeedback(id) {
    if (!confirm("Deseja excluir este feedback?")) return;
    await deleteDoc(doc(db, "feedbacks", id));
    setFeedbacks((current) => current.filter((item) => item.id !== id));
  }

  async function toggleFeedback(item) {
    const visible = item.visible === false;
    await updateDoc(doc(db, "feedbacks", item.id), { visible });
    setFeedbacks((current) =>
      current.map((feedback) =>
        feedback.id === item.id ? { ...feedback, visible } : feedback
      )
    );
  }

  function replyBudget(item) {
    const number = String(item.whatsapp || "").replace(/\D/g, "");
    if (!number) {
      alert("Este orçamento não possui WhatsApp.");
      return;
    }

    const finalNumber = number.startsWith("55") ? number : `55${number}`;
    const message =
      `Olá, ${item.nome || ""}! ` +
      "Recebi sua solicitação de orçamento pelo site Publici Karol e estou entrando em contato para continuarmos seu atendimento.";

    window.open(
      `https://wa.me/${finalNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  if (loading) {
    return <div className="admin-center">Carregando...</div>;
  }

  if (!user || !authorized) {
    return (
      <div className="admin-login">
        <form onSubmit={handleLogin}>
          <img
            className="admin-login-logo"
            src="/publici-karol-logo.png"
            alt="Publici Karol"
          />

          <span className="eyebrow">ADMINISTRAÇÃO</span>
          <h1>Área Administrativa</h1>
          <p>Entre com uma conta autorizada no Firebase.</p>

          <input
            type="email"
            placeholder="E-mail"
            required
            value={login.email}
            onChange={(event) =>
              setLogin({ ...login, email: event.target.value })
            }
          />

          <input
            type="password"
            placeholder="Senha"
            required
            value={login.password}
            onChange={(event) =>
              setLogin({ ...login, password: event.target.value })
            }
          />

          {loginError && <p className="error">{loginError}</p>}

          <button className="admin-primary admin-login-button" type="submit">
            Entrar
          </button>

          <a className="back-site" href="/">
            Voltar ao site
          </a>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="admin-brand-row">
          <a href="/">
            <img
              className="admin-logo"
              src="/publici-karol-logo.png"
              alt="Publici Karol"
            />
          </a>

          <button
            className="admin-close-mobile"
            onClick={() => setMobileMenu(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          {PAGES.map(([id, label, Icon]) => (
            <button
              key={id}
              className={active === id ? "active" : ""}
              onClick={() => {
                setActive(id);
                setMobileMenu(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button className="admin-logout" onClick={() => signOut(auth)}>
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </aside>

      <main className="admin-content">
        <header className="admin-topbar">
          <button
            className="admin-menu-mobile"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={22} />
          </button>

          <div>
            <span className="eyebrow">PUBLICI KAROL</span>
            <h1>Painel Administrativo</h1>
          </div>

          <span className="admin-user-email">{user.email}</span>
        </header>

        {active === "dashboard" && (
          <AdminPage
            title="Visão geral"
            subtitle="Tudo que você precisa administrar, em um só lugar."
          >
            <div className="stats-grid">
              <Stat
                label="Serviços"
                value={services.length}
                detail={`${services.filter((item) => item.visible !== false).length} visíveis`}
              />
              <Stat
                label="Projetos"
                value={projects.length}
                detail={`${projects.filter((item) => item.visible !== false).length} visíveis`}
              />
              <Stat
                label="Feedbacks"
                value={feedbacks.length}
                detail={`${feedbacks.filter((item) => item.visible !== false).length} visíveis`}
              />
              <Stat
                label="Orçamentos"
                value={budgets.length}
                detail={`${budgets.filter((item) => (item.status || "novo") === "novo").length} novos`}
              />
            </div>

            <div className="dashboard-shortcuts">
              <Shortcut
                title="Adicionar projeto"
                text="Cadastre uma nova peça no portfólio."
                onClick={() => setActive("portfolio")}
              />
              <Shortcut
                title="Alterar preços"
                text="Edite serviços e valores do pré-orçamento."
                onClick={() => setActive("servicos")}
              />
              <Shortcut
                title="Ver orçamentos"
                text="Acesse solicitações recebidas pelo site."
                onClick={() => setActive("orcamento")}
              />
            </div>
          </AdminPage>
        )}

        {active === "home" && (
          <AdminPage
            title="Home"
            subtitle="Controle todos os textos da primeira tela do site."
          >
            <div className="admin-form-grid">
              {textField("heroEyebrow", "Texto superior")}
              {textField("heroNome", "Nome")}
              {textField("heroSobrenome", "Sobrenome")}
              {textField("heroProfissao", "Profissão")}
              {textField("heroDescricao", "Descrição", true)}
              {textField("heroBotao", "Texto do botão")}
              {textField("heroCardLinha1", "Card da foto — linha 1")}
              {textField("heroCardLinha2", "Card da foto — linha 2")}
            </div>
            <SaveSiteButton saving={savingSite} onClick={saveSite} />
          </AdminPage>
        )}

        {active === "sobre" && (
          <AdminPage
            title="Sobre mim"
            subtitle="Atualize a apresentação profissional."
          >
            <div className="admin-form-grid">
              {textField("sobreEyebrow", "Texto superior")}
              {textField("sobreTitulo", "Título")}
              {textField("sobreTexto1", "Primeiro parágrafo", true)}
              {textField("sobreTexto2", "Segundo parágrafo", true)}
            </div>
            <SaveSiteButton saving={savingSite} onClick={saveSite} />
          </AdminPage>
        )}

        {active === "servicos" && (
          <AdminPage
            title="Serviços"
            subtitle="Adicione, edite, esconda ou exclua serviços, imagens e valores."
            action={
              <VisibilityButton
                visible={site.servicesVisible !== false}
                onClick={() =>
                  changeSectionVisibility("servicesVisible")
                }
                visibleText="Seção visível"
                hiddenText="Seção escondida"
              />
            }
          >
            <div className="admin-items-list">
              {services.map((item, index) => (
                <ItemEditor
                  key={item.id}
                  imageUrl={item.imageUrl}
                  uploading={uploadingKey === `services-${index}`}
                  onImage={(file) =>
                    setItemImage("services", index, file, false)
                  }
                  fields={
                    <>
                      <input
                        placeholder="Nome do serviço"
                        value={item.name || ""}
                        onChange={(event) =>
                          setServices((current) =>
                            current.map((service, position) =>
                              position === index
                                ? {
                                    ...service,
                                    name: event.target.value,
                                  }
                                : service
                            )
                          )
                        }
                      />
                      <textarea
                        placeholder="Descrição"
                        value={item.description || ""}
                        onChange={(event) =>
                          setServices((current) =>
                            current.map((service, position) =>
                              position === index
                                ? {
                                    ...service,
                                    description: event.target.value,
                                  }
                                : service
                            )
                          )
                        }
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Valor"
                        value={item.price ?? ""}
                        onChange={(event) =>
                          setServices((current) =>
                            current.map((service, position) =>
                              position === index
                                ? {
                                    ...service,
                                    price: event.target.value,
                                  }
                                : service
                            )
                          )
                        }
                      />
                    </>
                  }
                  actions={
                    <EditorActions
                      visible={item.visible !== false}
                      onVisibility={() => toggleService(item)}
                      onSave={() => saveService(item)}
                      onDelete={() => deleteService(item.id)}
                    />
                  }
                />
              ))}

              <ItemEditor
                newItem
                imageUrl={newService.imageUrl}
                uploading={uploadingKey === "services-new"}
                onImage={(file) =>
                  setItemImage("services", -1, file, true)
                }
                fields={
                  <>
                    <input
                      placeholder="Nome do novo serviço"
                      value={newService.name}
                      onChange={(event) =>
                        setNewService({
                          ...newService,
                          name: event.target.value,
                        })
                      }
                    />
                    <textarea
                      placeholder="Descrição"
                      value={newService.description}
                      onChange={(event) =>
                        setNewService({
                          ...newService,
                          description: event.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Valor"
                      value={newService.price}
                      onChange={(event) =>
                        setNewService({
                          ...newService,
                          price: event.target.value,
                        })
                      }
                    />
                  </>
                }
                actions={
                  <button className="admin-primary" onClick={addService}>
                    <Plus size={16} />
                    Adicionar serviço
                  </button>
                }
              />
            </div>
          </AdminPage>
        )}

        {active === "portfolio" && (
          <AdminPage
            title="Portfólio"
            subtitle="Gerencie seus projetos e esconda a seção inteira quando quiser."
            action={
              <VisibilityButton
                visible={site.portfolioVisible !== false}
                onClick={() =>
                  changeSectionVisibility("portfolioVisible")
                }
                visibleText="Portfólio visível"
                hiddenText="Portfólio escondido"
              />
            }
          >
            <div className="admin-form-grid">
              {textField("portfolioEyebrow", "Texto superior")}
              {textField("portfolioTitulo", "Título")}
              {textField("portfolioDescricao", "Descrição", true)}
            </div>

            <SaveSiteButton saving={savingSite} onClick={saveSite} />

            <div className="admin-divider" />

            <div className="portfolio-admin-grid">
              {projects.map((item, index) => (
                <ProjectEditor
                  key={item.id}
                  imageUrl={item.imageUrl}
                  uploading={uploadingKey === `portfolio-${index}`}
                  onImage={(file) =>
                    setItemImage("portfolio", index, file, false)
                  }
                  title={item.title || ""}
                  category={item.category || ""}
                  description={item.description || ""}
                  onTitle={(value) =>
                    setProjects((current) =>
                      current.map((project, position) =>
                        position === index
                          ? { ...project, title: value }
                          : project
                      )
                    )
                  }
                  onCategory={(value) =>
                    setProjects((current) =>
                      current.map((project, position) =>
                        position === index
                          ? { ...project, category: value }
                          : project
                      )
                    )
                  }
                  onDescription={(value) =>
                    setProjects((current) =>
                      current.map((project, position) =>
                        position === index
                          ? { ...project, description: value }
                          : project
                      )
                    )
                  }
                  actions={
                    <EditorActions
                      visible={item.visible !== false}
                      onVisibility={() => toggleProject(item)}
                      onSave={() => saveProject(item)}
                      onDelete={() => deleteProject(item.id)}
                    />
                  }
                />
              ))}

              <ProjectEditor
                newItem
                imageUrl={newProject.imageUrl}
                uploading={uploadingKey === "portfolio-new"}
                onImage={(file) =>
                  setItemImage("portfolio", -1, file, true)
                }
                title={newProject.title}
                category={newProject.category}
                description={newProject.description}
                onTitle={(value) =>
                  setNewProject({ ...newProject, title: value })
                }
                onCategory={(value) =>
                  setNewProject({ ...newProject, category: value })
                }
                onDescription={(value) =>
                  setNewProject({ ...newProject, description: value })
                }
                actions={
                  <button className="admin-primary" onClick={addProject}>
                    <Plus size={16} />
                    Adicionar projeto
                  </button>
                }
              />
            </div>
          </AdminPage>
        )}

        {active === "feedbacks" && (
          <AdminPage
            title="Feedbacks"
            subtitle="Adicione, edite, esconda ou exclua depoimentos."
            action={
              <VisibilityButton
                visible={site.feedbacksVisible !== false}
                onClick={() =>
                  changeSectionVisibility("feedbacksVisible")
                }
                visibleText="Seção visível"
                hiddenText="Seção escondida"
              />
            }
          >
            <div className="admin-form-grid">
              {textField("feedbacksEyebrow", "Texto superior")}
              {textField("feedbacksTitulo", "Título")}
              {textField("feedbacksDescricao", "Descrição", true)}
            </div>

            <SaveSiteButton saving={savingSite} onClick={saveSite} />

            <div className="admin-divider" />

            <div className="feedback-admin-grid">
              {feedbacks.map((item, index) => (
                <div className="feedback-admin-card" key={item.id}>
                  <input
                    placeholder="Nome"
                    value={item.name || ""}
                    onChange={(event) =>
                      setFeedbacks((current) =>
                        current.map((feedback, position) =>
                          position === index
                            ? { ...feedback, name: event.target.value }
                            : feedback
                        )
                      )
                    }
                  />

                  <input
                    placeholder="Cargo ou empresa (opcional)"
                    value={item.role || ""}
                    onChange={(event) =>
                      setFeedbacks((current) =>
                        current.map((feedback, position) =>
                          position === index
                            ? { ...feedback, role: event.target.value }
                            : feedback
                        )
                      )
                    }
                  />

                  <textarea
                    placeholder="Feedback"
                    value={item.text || ""}
                    onChange={(event) =>
                      setFeedbacks((current) =>
                        current.map((feedback, position) =>
                          position === index
                            ? { ...feedback, text: event.target.value }
                            : feedback
                        )
                      )
                    }
                  />

                  <EditorActions
                    visible={item.visible !== false}
                    onVisibility={() => toggleFeedback(item)}
                    onSave={() => saveFeedback(item)}
                    onDelete={() => deleteFeedback(item.id)}
                  />
                </div>
              ))}

              <div className="feedback-admin-card new-card">
                <input
                  placeholder="Nome"
                  value={newFeedback.name}
                  onChange={(event) =>
                    setNewFeedback({
                      ...newFeedback,
                      name: event.target.value,
                    })
                  }
                />

                <input
                  placeholder="Cargo ou empresa (opcional)"
                  value={newFeedback.role}
                  onChange={(event) =>
                    setNewFeedback({
                      ...newFeedback,
                      role: event.target.value,
                    })
                  }
                />

                <textarea
                  placeholder="Novo feedback"
                  value={newFeedback.text}
                  onChange={(event) =>
                    setNewFeedback({
                      ...newFeedback,
                      text: event.target.value,
                    })
                  }
                />

                <button className="admin-primary" onClick={addFeedback}>
                  <Plus size={16} />
                  Adicionar feedback
                </button>
              </div>
            </div>
          </AdminPage>
        )}

        {active === "orcamento" && (
          <AdminPage
            title="Orçamento"
            subtitle="Edite os textos e acompanhe as solicitações recebidas."
          >
            <div className="admin-form-grid">
              {textField("orcamentoEyebrow", "Texto superior")}
              {textField("orcamentoTitulo", "Título")}
              {textField("orcamentoDescricao", "Descrição", true)}
              {textField("orcamentoBotao", "Botão principal")}
              {textField(
                "orcamentoPersonalizado",
                "Botão de orçamento personalizado"
              )}
              {textField("orcamentoAviso", "Aviso", true)}
            </div>

            <SaveSiteButton saving={savingSite} onClick={saveSite} />

            <div className="admin-divider" />

            <h3 className="admin-subheading">Solicitações recebidas</h3>

            <div className="budget-admin-list">
              {budgets.length === 0 && (
                <div className="admin-empty">
                  Nenhum orçamento recebido ainda.
                </div>
              )}

              {budgets.map((item) => (
                <article className="budget-admin-card" key={item.id}>
                  <div>
                    <span className="status">
                      {item.status || "novo"}
                    </span>
                    <h3>{item.nome || "Sem nome"}</h3>
                    <p>{item.whatsapp || "Sem WhatsApp"}</p>
                  </div>

                  <div>
                    <small>Estimativa</small>
                    <strong>{money(item.total)}</strong>
                  </div>

                  <div className="budget-tags">
                    {(item.services || []).map((service, index) => (
                      <span key={`${service.id || "s"}-${index}`}>
                        {service.name}
                      </span>
                    ))}
                  </div>

                  <button
                    className="admin-primary"
                    onClick={() => replyBudget(item)}
                  >
                    <MessageCircle size={16} />
                    Responder
                  </button>
                </article>
              ))}
            </div>
          </AdminPage>
        )}

        {active === "contato" && (
          <AdminPage
            title="Contato"
            subtitle="Mantenha Instagram, WhatsApp e e-mail atualizados."
          >
            <div className="admin-form-grid">
              {textField("contatoEyebrow", "Texto superior")}
              {textField("contatoTitulo", "Título")}
              {textField("contatoDescricao", "Descrição", true)}
              {textField("instagramTexto", "Nome do Instagram")}
              {textField("instagramUrl", "Link do Instagram")}
              {textField("whatsappTexto", "Texto do WhatsApp")}
              {textField("emailTexto", "Texto do e-mail")}
              {textField("email", "E-mail")}
            </div>

            <SaveSiteButton saving={savingSite} onClick={saveSite} />
          </AdminPage>
        )}

        {active === "config" && (
          <AdminPage
            title="Configurações"
            subtitle="Edite nomes do menu, títulos gerais e rodapé."
          >
            <div className="admin-form-grid">
              {textField("navSobre", "Menu — Sobre")}
              {textField("navTrabalhos", "Menu — Trabalhos")}
              {textField("navPortfolio", "Menu — Portfólio")}
              {textField("navFeedbacks", "Menu — Feedbacks")}
              {textField("navOrcamento", "Menu — Orçamento")}
              {textField("navContato", "Menu — Contato")}
              {textField("trabalhosEyebrow", "Serviços — texto superior")}
              {textField("trabalhosTitulo", "Serviços — título")}
              {textField(
                "trabalhosDescricao",
                "Serviços — descrição",
                true
              )}
              {textField("rodapeTexto", "Texto do rodapé")}
            </div>

            <SaveSiteButton saving={savingSite} onClick={saveSite} />
          </AdminPage>
        )}
      </main>
    </div>
  );
}

function AdminPage({ title, subtitle, action, children }) {
  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SaveSiteButton({ saving, onClick }) {
  return (
    <button
      className="admin-primary save-site-button"
      disabled={saving}
      onClick={onClick}
    >
      <Save size={16} />
      {saving ? "Salvando..." : "Salvar alterações"}
    </button>
  );
}

function VisibilityButton({
  visible,
  onClick,
  visibleText,
  hiddenText,
}) {
  return (
    <button
      className={`visibility-button ${visible ? "" : "hidden"}`}
      onClick={onClick}
    >
      {visible ? <Eye size={17} /> : <EyeOff size={17} />}
      {visible ? visibleText : hiddenText}
    </button>
  );
}

function ItemEditor({
  imageUrl,
  uploading,
  onImage,
  fields,
  actions,
  newItem = false,
}) {
  return (
    <article className={`item-editor ${newItem ? "new-card" : ""}`}>
      <ImagePicker
        imageUrl={imageUrl}
        uploading={uploading}
        onImage={onImage}
      />
      <div className="item-editor-fields">{fields}</div>
      <div className="item-editor-actions">{actions}</div>
    </article>
  );
}

function ProjectEditor({
  imageUrl,
  uploading,
  onImage,
  title,
  category,
  description,
  onTitle,
  onCategory,
  onDescription,
  actions,
  newItem = false,
}) {
  return (
    <article className={`project-editor ${newItem ? "new-card" : ""}`}>
      <ImagePicker
        imageUrl={imageUrl}
        uploading={uploading}
        onImage={onImage}
        large
      />

      <div className="project-editor-body">
        <input
          placeholder="Título do projeto"
          value={title}
          onChange={(event) => onTitle(event.target.value)}
        />

        <input
          placeholder="Categoria"
          value={category}
          onChange={(event) => onCategory(event.target.value)}
        />

        <textarea
          placeholder="Descrição"
          value={description}
          onChange={(event) => onDescription(event.target.value)}
        />

        <div className="project-editor-actions">{actions}</div>
      </div>
    </article>
  );
}

function ImagePicker({ imageUrl, uploading, onImage, large = false }) {
  return (
    <div className={`image-picker ${large ? "large" : ""}`}>
      {imageUrl ? (
        <img src={imageUrl} alt="" />
      ) : (
        <Images size={34} />
      )}

      <label>
        <Upload size={15} />
        {uploading ? "Enviando..." : imageUrl ? "Trocar imagem" : "Adicionar imagem"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={uploading}
          onChange={(event) => onImage(event.target.files?.[0])}
        />
      </label>
    </div>
  );
}

function EditorActions({
  visible,
  onVisibility,
  onSave,
  onDelete,
}) {
  return (
    <div className="editor-actions">
      <button className="ghost-button" onClick={onVisibility}>
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        {visible ? "Ocultar" : "Exibir"}
      </button>

      <button className="admin-primary small" onClick={onSave}>
        <Save size={15} />
        Salvar
      </button>

      <button className="delete-button" onClick={onDelete}>
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function Stat({ label, value, detail }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Shortcut({ title, text, onClick }) {
  return (
    <button className="shortcut-card" onClick={onClick}>
      <strong>{title}</strong>
      <span>{text}</span>
    </button>
  );
}
