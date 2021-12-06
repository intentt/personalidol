const uiRoot = document.getElementById("ui-root");

uiRoot.addEventListener("error", function (evt) {
  document.body.classList.add("bootstrap-fatal-error");

  uiRoot.style.bottom = "0";
  uiRoot.style.right = "0";
  uiRoot.innerHTML = `
    <div class="ui-placeholder">
      <div class="ui-placeholder-label">
        Error: ${evt.detail.message}
      </div>
    </div>
  `;
});
