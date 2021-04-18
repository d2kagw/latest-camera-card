/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  customElement,
  property,
  CSSResult,
  TemplateResult,
  css,
  PropertyValues,
  internalProperty,
} from 'lit-element';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  // handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types

import './editor';

import type { CameraConfig, LatestCameraCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  LATEST-CAMERA-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'latest-camera-card',
  name: 'Latest Camera Card',
  description: '📹 Shows the camera feed with the latest movement',
});

@customElement('latest-camera-card')
export class LatestCameraCard extends LitElement {

  constructor() {
    super();

    this.activeCameras = [];
  }

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('latest-camera-card-editor');
  }

  public static getStubConfig(): object {
    return {};
  }

  @property({ attribute: false }) public hass!: HomeAssistant;
  @internalProperty() private config!: LatestCameraCardConfig;
  @internalProperty() private activeCameras: Array<CameraConfig>;

  public setConfig(config: LatestCameraCardConfig): void {
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'Latest Camera',
      ...config,
    };

    console.info("Latest camera card config:", this.config);
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('config')) {
      return true;
    }

    const equals = (a: Array<any>, b: Array<any>): boolean => JSON.stringify(a) === JSON.stringify(b);

    let newActiveCameras: Array<CameraConfig> = [];
    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
    if (oldHass) {
      newActiveCameras = this.config.cameras.filter((camera) => {
        return this.hass.states[camera.motion_entity].state === "on"
      });
    }

    const update = !equals(newActiveCameras, this.activeCameras);
    this.activeCameras = newActiveCameras;

    return update;
  }

  protected render(): TemplateResult | void {
    console.info("Latest camera card", "updating");

    const activeCameras = this.config.cameras.filter(camera => this.hass.states[camera.motion_entity].state === "on");

    return html`
      <ha-card
        @action=${this._handleAction}
        tabindex="0"
      >
        ${activeCameras.length === 0 ? html`<h1>No movement</h1>` : html``}
        ${activeCameras.map((camera) => {
          return html`
            <div class="live-camera-card">
              <hui-image
                .hass=${this.hass}
                .cameraImage=${camera.camera_entity}
                .cameraView=${"live"}
                .entity=${camera.camera_entity}
              ></hui-image>
            </div>
          `;
        })}
      </ha-card>
    `;
  }

  public _handleAction(ev: ActionHandlerEvent): void {
    // TODO: Show the camera feed for the active camera
    console.warn("handle", ev);
    // if (this.hass && this.config && ev.detail.action) {
    //   handleAction(this, this.hass, this.config, ev.detail.action);
    // }
  }

  private _showWarning(warning: string): TemplateResult {
    return html`
      <hui-warning>${warning}</hui-warning>
    `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html`
      ${errorCard}
    `;
  }

  static get styles(): CSSResult {
    return css``;
  }
}
