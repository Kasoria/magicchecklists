document.addEventListener('DOMContentLoaded', function() {
  initWebhookEndpoints();
  initWebhookSecret();
  initWebhookLogs();
});

function initWebhookEndpoints() {
  const wrapper = document.querySelector('.mcl-webhook-endpoints');
  if (!wrapper) return;

  // Add new endpoint
  wrapper.addEventListener('click', e => {
      if (e.target.matches('.add-endpoint')) {
          const template = `
              <div class="mcl-endpoint-item">
                  <input type="text" 
                         class="regular-text"
                         name="mcl_integration_settings[webhook_endpoints][]"
                         placeholder="https://">
                  <button type="button" class="button test-endpoint">Test</button>
                  <button type="button" class="button remove-endpoint">Remove</button>
              </div>
          `;
          document.querySelector('.mcl-endpoint-list').insertAdjacentHTML('beforeend', template);
      }

      // Remove endpoint
      if (e.target.matches('.remove-endpoint')) {
          if (confirm(mclIntegration.i18n.confirmDeleteEndpoint)) {
              e.target.closest('.mcl-endpoint-item').remove();
          }
      }

      // Test endpoint
      if (e.target.matches('.test-endpoint')) {
          const button = e.target;
          const input = button.previousElementSibling;
          const endpoint = input.value;

          if (!endpoint) return;

          button.disabled = true;
          button.textContent = mclIntegration.i18n.testingConnection;

          fetch(mclIntegration.ajaxurl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: new URLSearchParams({
                  action: 'mcl_test_webhook',
                  nonce: mclIntegration.nonce,
                  endpoint: endpoint
              })
          })
          .then(response => response.json())
          .then(response => {
              if (response.success) {
                  alert(mclIntegration.i18n.testSuccess);
              } else {
                  alert(mclIntegration.i18n.testFailed + ' ' + response.data.message);
              }
          })
          .catch(() => {
              alert(mclIntegration.i18n.testFailed);
          })
          .finally(() => {
              button.disabled = false;
              button.textContent = 'Test';
          });
      }
  });
}

function initWebhookSecret() {
  const generateButton = document.getElementById('generate-webhook-secret');
  if (!generateButton) return;

  generateButton.addEventListener('click', () => {
      const generateRandomString = (length = 32) => {
          const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          return Array.from(crypto.getRandomValues(new Uint8Array(length)))
              .map(x => chars[x % chars.length])
              .join('');
      };

      generateButton.previousElementSibling.value = generateRandomString();
  });
}

function initWebhookLogs() {
  const clearButton = document.querySelector('.clear-logs');
  if (!clearButton) return;

  clearButton.addEventListener('click', () => {
      if (!confirm(mclIntegration.i18n.confirmClearLogs)) {
          return;
      }

      clearButton.disabled = true;
      
      fetch(mclIntegration.ajaxurl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
              action: 'mcl_clear_webhook_logs',
              nonce: mclIntegration.nonce
          })
      })
      .then(response => response.json())
      .then(response => {
          if (response.success) {
              location.reload();
          } else {
              alert(response.data?.message || mclIntegration.i18n.clearLogsFailed);
          }
      })
      .catch(error => {
          console.error('Error clearing logs:', error);
          alert(mclIntegration.i18n.clearLogsFailed);
      })
      .finally(() => {
          clearButton.disabled = false;
      });
  });
}