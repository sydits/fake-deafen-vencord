/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin, { OptionType } from "@utils/types";
import { ContextMenuApi, Menu, React } from "@webpack/common";

export default definePlugin({
    name: "Fake Voice Options",
    description: "fake mute & deafen",
    authors: [
        {
            name: "r3",
            id: "1412136426438397972"
        }
    ],

    patches: [
        {
            find: "e.setSelfMute(n)",
            replacement: [
                {
                    // prevent client-side mute
                    match: /e\.setSelfMute\(n\),/g,
                    replace:
                        'e.setSelfMute(Vencord.Settings.plugins["Fake Voice Options"].fakeMute ? false : n),',
                },
                {
                    // prevent client-side deafen
                    match: /e\.setSelfDeaf\(t\.deaf\)/g,
                    replace:
                        'e.setSelfDeaf(Vencord.Settings.plugins["Fake Voice Options"].fakeDeafen ? false : t.deaf)',
                },
            ],
        },
    ],

    options: {
        fakeMute: {
            description:
                "Make everyone believe you're muted (you can still speak)",
            type: OptionType.BOOLEAN,
            default: false,
        },

        fakeDeafen: {
            description:
                "Make everyone believe you're deafened (you can still hear)",
            type: OptionType.BOOLEAN,
            default: false,
        },
    },

    async start() {
        const handler = (ev: MouseEvent) => {
            try {
                let el = ev.target as HTMLElement | null;

                while (el && el !== document.body) {
                    const button = el.closest("button");

                    if (button) {
                        // only target the bottom-left account/voice controls panel
                        const inAccountPanel =
                            !!button.closest('[class*="panels"]');

                        // detect icon buttons
                        const svg = button.querySelector("svg");

                        const hasVoiceIcon =
                            !!svg &&
                            (
                                svg.innerHTML.includes("path") ||
                                svg.getAttribute("aria-hidden") === "true"
                            );

                        // avoid opening on settings button
                        const aria = (
                            button.getAttribute("aria-label") ||
                            ""
                        ).toLowerCase();

                        const isSettings =
                            aria.includes("settings") ||
                            aria.includes("param");

                        if (
                            inAccountPanel &&
                            hasVoiceIcon &&
                            !isSettings
                        ) {
                            ev.preventDefault();
                            ev.stopPropagation();

                            ContextMenuApi.openContextMenu(ev as any, () => {
                                const FakeVoiceMenu = () => {
                                    const [mute, setMute] = React.useState(
                                        !!Vencord.Settings.plugins[
                                            "Fake Voice Options"
                                        ].fakeMute
                                    );

                                    const [deafen, setDeafen] = React.useState(
                                        !!Vencord.Settings.plugins[
                                            "Fake Voice Options"
                                        ].fakeDeafen
                                    );

                                    const toggleMute = () => {
                                        const next = !Vencord.Settings.plugins[
                                            "Fake Voice Options"
                                        ].fakeMute;

                                        Vencord.Settings.plugins[
                                            "Fake Voice Options"
                                        ].fakeMute = next;

                                        setMute(next);
                                    };

                                    const toggleDeafen = () => {
                                        const next = !Vencord.Settings.plugins[
                                            "Fake Voice Options"
                                        ].fakeDeafen;

                                        Vencord.Settings.plugins[
                                            "Fake Voice Options"
                                        ].fakeDeafen = next;

                                        setDeafen(next);
                                    };

                                    return React.createElement(
                                        Menu.Menu,
                                        {
                                            navId: "fake-voice-menu",
                                            onClose:
                                                ContextMenuApi.closeContextMenu,
                                            "aria-label": "Fake Voice Options",
                                        },

                                        React.createElement(
                                            Menu.MenuCheckboxItem,
                                            {
                                                id: "fake-voice-mute",
                                                label: "Fake Mute",
                                                checked: mute,
                                                action: toggleMute,
                                            }
                                        ),

                                        React.createElement(
                                            Menu.MenuCheckboxItem,
                                            {
                                                id: "fake-voice-deafen",
                                                label: "Fake Deafen",
                                                checked: deafen,
                                                action: toggleDeafen,
                                            }
                                        )
                                    );
                                };

                                return React.createElement(FakeVoiceMenu);
                            });

                            return;
                        }
                    }

                    el = el.parentElement;
                }
            } catch (e) {
                console.error(
                    "Fake Voice Options contextmenu handler error:",
                    e
                );
            }
        };

        (this as any)._fakeVoice_contextHandler = handler;

        document.addEventListener(
            "contextmenu",
            handler,
            true
        );
    },

    async stop() {
        const h = (this as any)._fakeVoice_contextHandler;

        if (h) {
            document.removeEventListener(
                "contextmenu",
                h,
                true
            );

            delete (this as any)._fakeVoice_contextHandler;
        }
    },
});