import { h } from "preact";

import { DOMElementView } from "../../dom-renderer/src/DOMElementView";

import type { DOMElementViewContext } from "./DOMElementViewContext.type";
import type { MessageUIStateChange } from "./MessageUIStateChange.type";

const _css = `
  :host {
    all: initial;
  }

  *, * * {
    box-sizing: border-box;
  }

  svg {
    height: 1.6rem;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 1.86rem;
  }

  div {
    position: relative;
  }

  span {
  }
`;

export class MainMenuLanguageButtonDOMElementView extends DOMElementView<DOMElementViewContext> {
  public static css: string = _css;

  constructor() {
    super();

    this.onButtonLanguageClick = this.onButtonLanguageClick.bind(this);
  }

  onButtonLanguageClick(evt: MouseEvent) {
    evt.preventDefault();

    const message: MessageUIStateChange = {
      isLanguageSettingsScreenOpened: true,
    };

    this.context.uiMessagePort.postMessage(message);
  }

  render() {
    return (
      <pi-main-menu-button onClick={this.onButtonLanguageClick}>
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3214.947 3725.333">
            <path fill="black" d="M1606.09 478.878L362.44 39.956v2706.781l1243.65-402.36v-1865.5" />
            <g fill="white">
              <path d="M1576.235 477.532L2867.503 38.609v2706.78l-1291.267-402.357v-1865.5" />
              <path d="M39.947 3220.574l1536.292-512.067V477.23L39.947 989.294v2231.28" />
            </g>
            <g fill="black">
              <path d="M2276.267 3254.281l217.732 358.212 114.82-332.759-332.552-25.453m-1713.95-2007.93c-8.16-8.011 10.627 65.471 36.772 91.911 46.361 46.779 82.573 52.802 101.854 53.579 42.666 1.708 95.319-10.635 126.586-23.739 30.253-12.902 83.265-39.963 103.332-79.444 4.254-8.446 15.867-22.621 8.573-57.631-5.533-26.937-22.68-36.361-43.586-34.87-20.907 1.413-84.2 18.289-114.813 27.713-30.626 9.284-93.706 28.489-121.199 34.451-27.426 5.946-87.893-2.764-97.519-11.97M1337.465 2124.891c-12.108-4.396-262.587-108.151-298.093-125.152-29.054-13.974-100.294-44.09-133.813-57.773 94.413-145.574 154.012-255.428 161.947-272.167l116.946-238.194c2.266-12.198 5.106-57.263 2.907-67.976-2.199-10.917-38.84 10.073-88.586 26.943-49.827 16.798-144.52 78.384-181.094 86.099-36.706 7.656-154.012 52.096-214.04 72.008-60.026 19.927-173.573 54.585-220.28 67.19-46.773 12.62-87.599 13.61-113.759 21.543 0 0 3.48 36.652 10.426 47.627 6.868 10.99 31.614 37.918 60.387 45.444 28.773 7.569 76.4 4.541 98.093-.422 21.681-5.036 59.24-23.391 64.281-31.397 5.093-8.151-2.627-33.246 5.946-40.829 8.654-7.511 122.973-34.236 166.133-47.263 43.16-13.275 208.373-70.174 230.773-67.278-7.093 23.537-139.986 286.767-182.787 365.296-42.813 78.515-291.505 423.973-344.452 484.853-40.186 46.281-137.573 164.707-171.306 191.427 8.507 2.346 68.813-2.827 79.8-9.627C455.359 2533.07 569.4 2391.11 606.12 2347.87c109.146-128.001 205.04-262.454 281.079-377.839h.082c14.812 6.172 134.586 103.755 165.839 125.385 31.253 21.616 154.586 90.422 181.306 101.848 26.72 11.557 129.413 58.893 133.733 42.867 4.32-16.157-18.573-110.64-30.693-115.24" />
              <g fill-rule="evenodd">
                <path d="M758.664 3429.335c23.999 14.666 46.666 26.667 72 38.667 50.666 25.333 107.999 52 162.665 72 74.667 27.999 149.333 50.666 223.999 67.999 41.334 9.333 86.667 17.333 130.666 24 4.001 0 122.666 14.667 146.667 14.667h119.998c46.668-4 90.674-6.667 137.327-13.333 37.337-5.333 78.667-12 118.666-21.333 29.338-6.667 60.006-13.333 89.344-22.667 27.992-8 59.991-18.666 90.659-29.333 20.007-6.666 41.33-16 62.668-23.999 17.33-8 38.668-17.333 58.66-25.333 24.014-10.667 52.006-25.333 78.667-38.667 21.338-10.667 45.337-23.999 68.006-37.333 17.33-9.334 57.329-40 78.667-40 23.999 0 39.999 21.333 39.999 40 0 38.667-52.006 50.666-76.006 68-25.33 17.333-55.999 30.665-82.66 45.333-53.337 28-108.005 52-159.996 72-68.006 25.333-142.666 49.333-209.341 65.333-25.33 5.333-50.66 12-75.991 16-13.338 2.667-152.011 24-190.664 24h-176.006c-46.666-4-95.999-9.333-142.666-16-41.333-6.667-85.333-14.667-126.666-24-31.999-6.667-66.666-16-97.333-25.333-53.332-14.667-105.333-33.333-155.999-53.333-91.999-34.667-188-79.999-278.665-139.999-16-10.666-17.333-21.333-17.333-33.333 0-19.999 14.666-38.667 38.667-38.667 21.333 0 64 30.667 72 34.667m857.333-2957.333v2239.997c-1.333 6.668-4 13.334-9.334 20-2.666 4-7.999 9.334-11.999 10.667C1561.33 2756.003 60 3260.001 40 3260.001c-16 0-30.667-10.667-38.667-27.999 0-1.335-1.333-2.668-1.333-5.333V985.349c2.667-6.674 4-16.01 9.333-21.333C20 949.337 38.667 946.675 50.667 942.683c22.667-8.005 1501.33-504.008 1522.663-504.008 13.334 0 42.666 9.336 42.666 33.33zm-81.334 2206.665L81.333 3162.667V1018.679l1453.329-484.006V2678.67" />
                <path d="M2907.992 42.68v2697.324c-1.326 30.666-22.672 44-42.67 44-17.324 0-142.659-42.668-164.006-49.334l-503.988-156-112-36.001c-32.001-9.332-66.667-19.998-98.666-30.666l-430.666-135.999c-5.334-1.332-18.668-20-18.668-24V468.007c2.667-6.674 5.334-14.673 12.001-19.998 10.666-11.999 467.999-164.006 647.998-223.999 48.001-17.324 649.323-224 667.995-224 23.997 0 42.67 17.324 42.67 42.67zm-81.34 2646.657L1617.33 2313.338V506.677L2826.652 96v2593.337" />
              </g>
              <path d="M3214.926 3254.283l-1615.6-514.944 6.758-2241.723 1608.841 512.059v2244.609" />
            </g>
            <path
              fill="white"
              fill-rule="evenodd"
              d="M2305.305 1137.595l208.147 63.053 379.204 1366.689-213.808-64.866-76.806-280.572-441.831-133.919-95.014 228.559-213.861-64.881zm95.156 361.813l-158.581 383.286 291.537 88.366-132.956-471.652"
            />
          </svg>
          <span>{this.t("ui:menu_language")}</span>
        </div>
      </pi-main-menu-button>
    );
  }
}
