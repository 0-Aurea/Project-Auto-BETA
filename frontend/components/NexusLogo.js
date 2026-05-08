export class NexusLogo {
  constructor({ logoContainerElement }) {
    this.logoContainerElement = logoContainerElement;
    this.renderLogo = this.renderLogo.bind(this);

    this.renderLogo();
  }

  renderLogo() {
    const logoElement = document.createElement('span');
    logoElement.classList.add('nexus-logo');
    logoElement.innerHTML = `
      <span class="logo-text">Nexus</span>
    `;

    this.logoContainerElement.appendChild(logoElement);
  }
}