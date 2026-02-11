/* ============================================
   Meta Ad Copy Generator — Frontend Logic
   ============================================ */

(function () {
  'use strict';

  // Constants
  const API_URL = '/api/generate';
  const MAX_FREE_GENERATIONS = 5;
  const EMAIL_PROMPT_AT = 3;
  const STORAGE_KEY = 'adadvisor_adgen';

  // State
  let state = {
    generations: 0,
    lastDate: null,
    emailCaptured: false
  };

  // DOM Elements
  const adForm = document.getElementById('adForm');
  const generateBtn = document.getElementById('generateBtn');
  const btnText = generateBtn.querySelector('.btn-text');
  const btnLoading = generateBtn.querySelector('.btn-loading');
  const genCounter = document.getElementById('genCounter');
  const resultsSection = document.getElementById('resultsSection');
  const resultsContainer = document.getElementById('resultsContainer');
  const generateMoreBtn = document.getElementById('generateMoreBtn');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const emailModal = document.getElementById('emailModal');
  const limitModal = document.getElementById('limitModal');
  const errorToast = document.getElementById('errorToast');
  const successToast = document.getElementById('successToast');
  const descInput = document.getElementById('description');
  const descCount = document.getElementById('descCount');

  // ============================================
  // Initialize
  // ============================================

  function init() {
    loadState();
    checkDailyReset();
    updateCounter();
    bindEvents();
  }

  // ============================================
  // State Management
  // ============================================

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        state = JSON.parse(saved);
      }
    } catch (e) {
      // Fresh state if localStorage fails
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Silently fail
    }
  }

  function checkDailyReset() {
    const today = new Date().toDateString();
    if (state.lastDate !== today) {
      state.generations = 0;
      state.lastDate = today;
      saveState();
    }
  }

  function updateCounter() {
    const remaining = MAX_FREE_GENERATIONS - state.generations;
    if (state.generations > 0) {
      genCounter.textContent = `${remaining} generation${remaining !== 1 ? 's' : ''} remaining today`;
    } else {
      genCounter.textContent = '';
    }
  }

  // ============================================
  // Event Bindings
  // ============================================

  function bindEvents() {
    adForm.addEventListener('submit', handleGenerate);
    generateMoreBtn.addEventListener('click', handleGenerate);

    // Character count for description
    descInput.addEventListener('input', function () {
      descCount.textContent = this.value.length;
    });

    // Email modal
    document.getElementById('modalClose').addEventListener('click', hideEmailModal);
    document.getElementById('modalSkip').addEventListener('click', hideEmailModal);
    document.getElementById('emailForm').addEventListener('submit', handleEmailSubmit);

    // Limit modal
    document.getElementById('limitModalClose').addEventListener('click', function () {
      limitModal.classList.add('hidden');
    });

    // Close modals on overlay click
    emailModal.addEventListener('click', function (e) {
      if (e.target === emailModal) hideEmailModal();
    });
    limitModal.addEventListener('click', function (e) {
      if (e.target === limitModal) limitModal.classList.add('hidden');
    });
  }

  // ============================================
  // Generation
  // ============================================

  async function handleGenerate(e) {
    e.preventDefault();

    // Check daily limit
    if (state.generations >= MAX_FREE_GENERATIONS) {
      limitModal.classList.remove('hidden');
      return;
    }

    // Collect form data
    const formData = {
      productName: document.getElementById('productName').value.trim(),
      description: document.getElementById('description').value.trim(),
      targetAudience: document.getElementById('targetAudience').value.trim(),
      goal: document.getElementById('goal').value,
      tone: document.getElementById('tone').value,
      count: 5
    };

    // Validate
    if (!formData.productName || !formData.description || !formData.targetAudience || !formData.goal || !formData.tone) {
      showError('Please fill in all fields.');
      return;
    }

    // Show loading
    showLoading();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          state.generations = MAX_FREE_GENERATIONS;
          saveState();
          updateCounter();
          hideLoading();
          limitModal.classList.remove('hidden');
          return;
        }
        throw new Error(data.error || 'Failed to generate ad copy.');
      }

      // Success — update state
      state.generations++;
      saveState();
      updateCounter();

      // Display results
      displayResults(data.variations);

      // Check if we should show email modal
      if (state.generations >= EMAIL_PROMPT_AT && !state.emailCaptured) {
        setTimeout(function () {
          emailModal.classList.remove('hidden');
        }, 1200);
      }

    } catch (error) {
      showError(error.message || 'Something went wrong. Please try again.');
    } finally {
      hideLoading();
    }
  }

  // ============================================
  // Display Results
  // ============================================

  function displayResults(variations) {
    resultsContainer.innerHTML = '';

    variations.forEach(function (v, i) {
      var card = document.createElement('div');
      card.className = 'variation-card';

      var primaryLen = v.primaryText.length;
      var headlineLen = v.headline.length;
      var descLen = v.description.length;

      card.innerHTML =
        '<div class="variation-header">' +
          '<span class="variation-badge">' + escapeHtml(v.angle) + '</span>' +
          '<span class="variation-number">Variation ' + (i + 1) + '</span>' +
        '</div>' +
        '<div class="copy-field">' +
          '<div class="copy-field-label">' +
            '<span>Primary Text</span>' +
            '<span class="char-count ' + (primaryLen > 125 ? 'over-limit' : '') + '">' + primaryLen + '/125</span>' +
          '</div>' +
          '<div class="copy-field-content">' +
            '<div class="copy-field-text">' + escapeHtml(v.primaryText) + '</div>' +
            '<button class="copy-btn" data-copy="' + escapeAttr(v.primaryText) + '" title="Copy">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="copy-field">' +
          '<div class="copy-field-label">' +
            '<span>Headline</span>' +
            '<span class="char-count ' + (headlineLen > 40 ? 'over-limit' : '') + '">' + headlineLen + '/40</span>' +
          '</div>' +
          '<div class="copy-field-content">' +
            '<div class="copy-field-text">' + escapeHtml(v.headline) + '</div>' +
            '<button class="copy-btn" data-copy="' + escapeAttr(v.headline) + '" title="Copy">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="copy-field">' +
          '<div class="copy-field-label">' +
            '<span>Description</span>' +
            '<span class="char-count ' + (descLen > 30 ? 'over-limit' : '') + '">' + descLen + '/30</span>' +
          '</div>' +
          '<div class="copy-field-content">' +
            '<div class="copy-field-text">' + escapeHtml(v.description) + '</div>' +
            '<button class="copy-btn" data-copy="' + escapeAttr(v.description) + '" title="Copy">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<button class="copy-all-btn" data-copyall="' + i + '" title="Copy all">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' +
          'Copy All' +
        '</button>';

      resultsContainer.appendChild(card);
    });

    // Bind copy buttons
    resultsContainer.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyToClipboard(this.getAttribute('data-copy'), this);
      });
    });

    // Bind copy-all buttons
    resultsContainer.querySelectorAll('.copy-all-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-copyall'));
        var v = variations[idx];
        var allText = 'Primary Text: ' + v.primaryText + '\nHeadline: ' + v.headline + '\nDescription: ' + v.description;
        copyToClipboard(allText, this);
      });
    });

    // Show results and generate more button
    resultsSection.classList.remove('hidden');
    generateMoreBtn.classList.remove('hidden');

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ============================================
  // Clipboard
  // ============================================

  function copyToClipboard(text, btnEl) {
    navigator.clipboard.writeText(text).then(function () {
      // Visual feedback on button
      if (btnEl) {
        btnEl.classList.add('copied');
        if (btnEl.classList.contains('copy-all-btn')) {
          var origHTML = btnEl.innerHTML;
          btnEl.innerHTML =
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>' +
            'Copied!';
          setTimeout(function () {
            btnEl.innerHTML = origHTML;
            btnEl.classList.remove('copied');
          }, 1500);
        } else {
          btnEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
          setTimeout(function () {
            btnEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
            btnEl.classList.remove('copied');
          }, 1500);
        }
      }
      showSuccess('Copied to clipboard!');
    }).catch(function () {
      showError('Failed to copy. Please select and copy manually.');
    });
  }

  // ============================================
  // Email Capture
  // ============================================

  function handleEmailSubmit(e) {
    e.preventDefault();
    var email = document.getElementById('emailInput').value.trim();
    if (!email) return;

    // In production, send to your email service/API
    console.log('[AdAdvisor] Email captured:', email);

    state.emailCaptured = true;
    saveState();
    hideEmailModal();
    showSuccess('Welcome! You now have unlimited access.');
  }

  function hideEmailModal() {
    emailModal.classList.add('hidden');
  }

  // ============================================
  // Loading & Notifications
  // ============================================

  function showLoading() {
    loadingOverlay.classList.remove('hidden');
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    generateBtn.disabled = true;
    generateMoreBtn.disabled = true;
  }

  function hideLoading() {
    loadingOverlay.classList.add('hidden');
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    generateBtn.disabled = false;
    generateMoreBtn.disabled = false;
  }

  function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    errorToast.classList.remove('hidden');
    setTimeout(function () {
      errorToast.classList.add('hidden');
    }, 4000);
  }

  function showSuccess(message) {
    document.getElementById('successMessage').textContent = message;
    successToast.classList.remove('hidden');
    setTimeout(function () {
      successToast.classList.add('hidden');
    }, 2000);
  }

  // ============================================
  // Utilities
  // ============================================

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ============================================
  // Boot
  // ============================================

  document.addEventListener('DOMContentLoaded', init);

})();
