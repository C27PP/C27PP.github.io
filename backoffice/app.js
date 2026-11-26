const API_BASE = "https://portfolio-api-three-black.vercel.app/api/v1";

// --Utilidades--
function showMessage(text, isError = true) {
  const msgBox = document.getElementById("message");
  if (!msgBox) return;
  msgBox.textContent = text;
  msgBox.className = isError ? "msg error" : "msg success";
  msgBox.style.display = "block";
  setTimeout(() => {
    msgBox.style.display = "none";
  }, 4000);
}

function getToken() {
  return localStorage.getItem("authToken");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("authUser") || "{}");
  } catch {
    return {};
  }
}

function saveSession(token, user) {
  localStorage.setItem("authToken", token);
  if (user) {
    localStorage.setItem("authUser", JSON.stringify(user));
  }
}

function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  window.location.href = "login.html";
}

// --1. Registro (POST /auth/register)--
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  if (getToken()) window.location.href = "index.html";

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = registerForm.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.textContent = "Registrando...";

    const payload = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      itsonId: document.getElementById("itsonId").value.trim(),
      password: document.getElementById("password").value
    };

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al registrar usuario.");

      showMessage("¡Registro exitoso! Redirigiendo al login...", false);
      setTimeout(() => (window.location.href = "login.html"), 1500);
    } catch (error) {
      showMessage(error.message, true);
      btn.disabled = false;
      btn.textContent = "Registrarse";
    }
  });
}

// --2. Login (POST /auth/login)--
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  if (getToken()) window.location.href = "index.html";

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.textContent = "Ingresando...";

    const payload = {
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value
    };

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Credenciales incorrectas.");

      saveSession(data.token, data.user);
      window.location.href = "index.html";
    } catch (error) {
      showMessage(error.message, true);
      btn.disabled = false;
      btn.textContent = "Entrar";
    }
  });
}

// --3. CRUD de Proyectos--
const homeView = document.getElementById("homeView");
if (homeView) {
  const token = getToken();
  const user = getUser();

  if (!token) {
    window.location.replace("login.html");
  } else {
    initHome();
  }

  async function initHome() {
    const welcomeTitle = document.getElementById("welcomeUser");
    if (welcomeTitle && user.name) {
      welcomeTitle.textContent = `Bienvenido, ${user.name}`;
    }

    document.getElementById("logoutBtn")?.addEventListener("click", logout);

    // Referencias del formulario CRUD
    const toggleFormBtn = document.getElementById("toggleFormBtn");
    const cancelFormBtn = document.getElementById("cancelFormBtn");
    const projectForm = document.getElementById("projectForm");
    const formTitle = document.getElementById("formTitle");
    const projectIdInput = document.getElementById("projectId");

    // Abrir formulario para CREAR
    toggleFormBtn.addEventListener("click", () => {
      resetForm();
      formTitle.textContent = "Nuevo Proyecto";
      projectForm.style.display = "block";
    });

    // Cerrar formulario
    cancelFormBtn.addEventListener("click", () => {
      resetForm();
      projectForm.style.display = "none";
    });

    function resetForm() {
      projectForm.reset();
      projectIdInput.value = "";
    }

    // Obtener proyectos del usuario (GET /projects)
    async function loadProjects() {
      const projectsList = document.getElementById("projectsList");
      const projectCount = document.getElementById("projectCount");

      try {
        const res = await fetch(`${API_BASE}/projects`, {
          headers: { "auth-token": token }
        });

        if (res.status === 401 || res.status === 403) {
          logout();
          return;
        }
        if (!res.ok) throw new Error("Error al cargar proyectos.");

        const projects = await res.json();
        homeView.style.display = "block";
        projectCount.textContent = projects.length;
        renderProjects(projects);
      } catch (error) {
        homeView.style.display = "block";
        projectsList.innerHTML = `<p class="muted-text">${error.message}</p>`;
      }
    }

    // Renderizar usando la etiqueta <template>
    function renderProjects(projects) {
      const projectsList = document.getElementById("projectsList");
      const template = document.getElementById("projectCardTemplate");
      projectsList.innerHTML = "";

      if (projects.length === 0) {
        projectsList.innerHTML = `<p class="muted-text">Aun no tienes proyectos registrados. Haz clic en "+ Agregar Proyecto".</p>`;
        return;
      }

      projects.forEach((proj) => {
        const clone = template.content.cloneNode(true);

        clone.querySelector(".project-title").textContent = proj.title;
        clone.querySelector(".project-desc").textContent = proj.description;

        // Tecnologias
        const techsContainer = clone.querySelector(".project-techs");
        if (Array.isArray(proj.technologies)) {
          proj.technologies.forEach((tech) => {
            if (tech.trim()) {
              const span = document.createElement("span");
              span.className = "tech-badge";
              span.textContent = tech.trim();
              techsContainer.appendChild(span);
            }
          });
        }

        // Imagenes del proyecto
        const imagesContainer = clone.querySelector(".project-images");
        if (Array.isArray(proj.images) && proj.images.length > 0) {
          proj.images.forEach((url) => {
            if (url && url.trim()) {
              const img = document.createElement("img");
              img.src = url.trim();
              img.alt = `Vista previa de ${proj.title}`;
              img.loading = "lazy";
              // Si la URL esta rota oculta esa imagen
              img.onerror = () => (img.style.display = "none");
              imagesContainer.appendChild(img);
            }
          });
        } else {
          imagesContainer.style.display = "none";
        }

        // Repositorio opcional
        const repoLink = clone.querySelector(".project-repo");
        if (proj.repository) {
          repoLink.href = proj.repository;
        } else {
          repoLink.style.display = "none";
        }

        // Boton Actualizar (llena el formulario con los datos del proyecto)
        clone.querySelector(".btn-edit").addEventListener("click", () => {
          projectIdInput.value = proj._id;
          document.getElementById("title").value = proj.title || "";
          document.getElementById("description").value = proj.description || "";
          document.getElementById("technologies").value = (proj.technologies || []).join(", ");
          document.getElementById("repository").value = proj.repository || "";
          document.getElementById("images").value = (proj.images || []).join(", ");

          formTitle.textContent = "Actualizar Proyecto";
          projectForm.style.display = "block";
          projectForm.scrollIntoView({ behavior: "smooth" });
        });

        // Boton Eliminar (DELETE /projects/:projectId)
        clone.querySelector(".btn-delete").addEventListener("click", () => {
          deleteProject(proj._id, proj.title);
        });

        projectsList.appendChild(clone);
      });
    }

    // Create y Update (Guarda el formulario)
    projectForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById("saveProjectBtn");
      saveBtn.disabled = true;
      saveBtn.textContent = "Guardando...";

      const id = projectIdInput.value;
      const techsRaw = document.getElementById("technologies").value;
      const imagesRaw = document.getElementById("images").value;

      const projectData = {
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        userId: user.id || user._id,
        technologies: techsRaw ? techsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
        repository: document.getElementById("repository").value.trim(),
        images: imagesRaw ? imagesRaw.split(",").map((img) => img.trim()).filter(Boolean) : []
      };

      try {
        const isUpdate = Boolean(id);
        const url = isUpdate ? `${API_BASE}/projects/${id}` : `${API_BASE}/projects`;
        const method = isUpdate ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "auth-token": token
          },
          body: JSON.stringify(projectData)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error al guardar el proyecto.");

        showMessage(isUpdate ? "Proyecto actualizado correctamente." : "Proyecto creado correctamente.", false);
        resetForm();
        projectForm.style.display = "none";
        await loadProjects();
      } catch (error) {
        showMessage(error.message, true);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Guardar Proyecto";
      }
    });

    // Delete (Elimina el proyecto)
    async function deleteProject(id, title) {
      if (!confirm(`¿Seguro que deseas eliminar el proyecto "${title}"?`)) return;

      try {
        const res = await fetch(`${API_BASE}/projects/${id}`, {
            method: "DELETE",
            headers: { "auth-token": token }
        });
        if (!res.ok) throw new Error("No se pudo eliminar el proyecto.");
            showMessage("Proyecto eliminado.", false);
            await loadProjects();
        } catch (error) {
            showMessage(error.message, true);
        }
    }
    // Cargar proyectos al iniciar Home
    loadProjects();
    }
}