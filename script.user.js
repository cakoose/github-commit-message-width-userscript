// ==UserScript==
// @name        GitHub commit message width
// @match       *://github.com/*/*/pull/*
// @grant       none
// @version     1.1
// @author      Kannan Goundan
// @description Modify GitHub commit message editor to use fixed-width font and show where the 72-column limit is.
// @downloadURL https://raw.githubusercontent.com/cakoose/github-commit-message-width-userscript/main/script.user.js
// ==/UserScript==

(function() {
    'use strict';

    const style = document.createElement('style');
    style.textContent = `
        .fixed-up-commit-message {
            font-family: "Menlo" !important;
            font-size: 10pt !important;
            text-wrap: nowrap !important;
            letter-spacing: normal !important;
            word-spacing: normal !important;
        }
    `;
    document.head.appendChild(style);

    const findAndFixTextareas = (node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        // For GitHub's old commit UI.
        for (const textarea of node.querySelectorAll('textarea.merge-commit-message')) {
            fixTextarea(textarea);
        }

        // For GitHub's new commit UI (2025-01)
        // Annoyingly, they stopped using stable class names or IDs. So we find a
        // label with the contents "Commit message" (only works for English) and
        // find the associated input element.
        for (const label of node.getElementsByTagName("label")) {
            if (label.textContent === 'Extended description') {
                const textareaId = label.getAttribute('for');
                if (textareaId !== null) {
                    const textarea = document.getElementById(textareaId);
                    if (textarea !== null) {
                        fixTextarea(textarea);
                    }
                }
            }
        }

    };

    const fixTextarea = (textarea) => {
        // Use a CSS class for the font
        textarea.classList.add('fixed-up-commit-message');

        // To start the background color at exactly at 72 columns, we need to adjust for
        // the element's border and padding. Unfortunately, there doesn't appear to be
        // a way to do that in pure CSS, so we use JS.
        const styles = window.getComputedStyle(textarea);
        const paddingLeft = parseFloat(styles.paddingLeft) ?? 0;
        const borderLeftWidth = parseFloat(styles.borderLeftWidth) ?? 0;
        const gradientStart = `calc(72ch + ${paddingLeft + borderLeftWidth}px)`;
        // Tried to pick a color that looks ok with both light and dark modes.
        textarea.style.background =
          `linear-gradient(to right, transparent ${gradientStart}, rgba(145, 103, 83, .3) ${gradientStart})`;
    }

    // Set up a MutationObserver so we can catch textareas that get added dynamically.
    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                findAndFixTextareas(node);
            }
        }
    }).observe(document.body, {
        childList: true,
        subtree: true
    });

    // Find any textareas in the already-loaded UI.
    findAndFixTextareas(document.body);
})();
