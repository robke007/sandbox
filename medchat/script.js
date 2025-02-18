document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("widget-form");
  const apiKeyInput = document.getElementById("api-key");
  const environmentSelect = document.getElementById("environment");
  const queryStringInput = document.getElementById("query-string");
  const prInput = document.getElementById("pr");
  const entryList = document.getElementById("entry-list");

  // Function to get query parameters from URL
  function getQueryParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const regex = /([^&=]+)=([^&]*)/g;
    let m;
    while ((m = regex.exec(queryString))) {
      params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }
    return params;
  }

  // Load last 20 entries
  const entries =
    JSON.parse(localStorage.getItem("entries"))?.map((entry) => {
      const env = entry.environment.replace("-", ".");
      return { ...entry, environment: env === "local" ? "localhost" : env };
    }) || [];
  if (entries.length > 0) {
    const firstEntry = entries[0];
    apiKeyInput.value = firstEntry.apiKey;
    queryStringInput.value = firstEntry.queryString || "";
    prInput.value = firstEntry.pr || "";
  }

  function renderEntryList() {
    entryList.innerHTML = "";
    entries.forEach((entry, index) => {
      const entryContainer = document.createElement("div");
      entryContainer.className = "entry-container";

      const entryLink = document.createElement("a");
      entryLink.href = "#";
      let entryText = `API Key: ${entry.apiKey}, Environment: ${entry.environment}`;
      if (entry.queryString) {
        entryText += `, Query String: ${entry.queryString}`;
      }
      if (entry.pr) {
        entryText += `, PR: ${entry.pr}`;
      }
      entryLink.textContent = entryText;
      entryLink.addEventListener("click", function (event) {
        event.preventDefault();
        triggerScript(
          entry.apiKey,
          entry.environment,
          entry.queryString,
          entry.pr
        );

        // Move the clicked entry to the top of the list
        entries.splice(index, 1);
        entries.unshift(entry);
        localStorage.setItem("entries", JSON.stringify(entries));

        // Re-render the entry list
        renderEntryList();
      });

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.className = "delete-button";
      deleteButton.addEventListener("click", function (event) {
        event.preventDefault();
        entries.splice(index, 1);
        localStorage.setItem("entries", JSON.stringify(entries));
        entryList.removeChild(entryContainer);
      });

      entryContainer.appendChild(entryLink);
      entryContainer.appendChild(deleteButton);
      entryList.appendChild(entryContainer);
    });
  }

  function triggerScript(apiKey, environment, queryString, pr) {
    if (document.getElementById("medchat-widget-script")) {
      const thisUrl = new URL(window.location.href.split("?")[0]);
      window.location.href = `${thisUrl}?api-key=${apiKey}&environment=${environment}&query-string=${queryString}&pr=${pr}`;
      return;
    }
    let src = "https://";

    switch (environment) {
      case "blue.dev":
        if (pr) {
          src += `blue.dev.medchatapp.com/pr/${pr}/apps`;
        } else {
          src += "blue.dev.medchatapp.com";
        }
        break;
      case "dev":
        if (pr) {
          src += `blue.dev.medchatapp.com/pr/${pr}/apps`;
        } else {
          src += "dev.medchatapp.com";
        }
        break;
      case "blue.prod":
        src += "blue.medchatapp.com";
        break;
      case "prod":
        src += "medchatapp.com";
        break;
      case "localhost":
        src = "http://localhost:9005/apps";
        break;
    }

    src += `/chat-ai/${apiKey}/widget.js`;

    if (queryString) {
      src += `?${queryString}`;
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = src;
    script.id = "medchat-widget-script";

    document.body.appendChild(script);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const apiKey = apiKeyInput.value.trim();
    const environment = environmentSelect.value;
    const queryString = queryStringInput.value.trim();
    const pr = prInput.value.trim();

    // Validate required fields
    if (!apiKey || !environment) {
      alert("API Key and Environment are required.");
      return;
    }

    // Save entry to local storage
    const entry = { apiKey, environment, queryString, pr };

    // Check for duplicate entries
    const isDuplicate = entries.some(
      (e) =>
        e.apiKey === entry.apiKey &&
        e.environment === entry.environment &&
        e.queryString === entry.queryString &&
        e.pr === entry.pr
    );

    if (!isDuplicate) {
      // Update entries list
      entries.unshift(entry);
      if (entries.length > 20) {
        entries.pop();
      }
      localStorage.setItem("entries", JSON.stringify(entries));

      // Re-render the entry list
      renderEntryList();
    }

    // Trigger script generation
    triggerScript(apiKey, environment, queryString, pr);
  });

  // Check for query parameters and trigger form submission
  const queryParams = getQueryParams();
  if (queryParams["api-key"] && queryParams["environment"]) {
    apiKeyInput.value = queryParams["api-key"];
    environmentSelect.value = queryParams["environment"];
    queryStringInput.value = queryParams["query-string"] || "";
    prInput.value = queryParams["pr"] || "";
    form.dispatchEvent(new Event("submit"));
  }

  // Initial render of the entry list
  renderEntryList();
});
