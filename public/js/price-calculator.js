// Price calculator initializer moved to external file to avoid CSP inline script blocking
(function(){
  function initCalculator() {
    console.log('PriceCalculator: initCalculator called');

    const origPriceInput = document.getElementById('origPrice');
    const forexRateInput = document.getElementById('forexRate');
    const transportInput = document.getElementById('transportCost');
    const profitInput = document.getElementById('profitPercent');

    const resultOrigPrice = document.getElementById('resultOrigPrice');
    const resultForexPrice = document.getElementById('resultForexPrice');
    const resultTransportCost = document.getElementById('resultTransportCost');
    const resultSubtotal = document.getElementById('resultSubtotal');
    const resultProfitAmount = document.getElementById('resultProfitAmount');
    const resultFinalPrice = document.getElementById('resultFinalPrice');

    const resetBtn = document.getElementById('resetCalcBtn');
    const copyBtn = document.getElementById('copyPriceBtn');

    if (!origPriceInput || !resultOrigPrice) {
      console.warn('PriceCalculator: required DOM elements missing, aborting init');
      return;
    }

    function formatMoney(amount) {
      try {
        return amount.toLocaleString('en-MW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } catch (e) {
        return Number(amount).toFixed(2);
      }
    }

    function calculatePrice() {
      const origPrice = parseFloat(origPriceInput.value) || 0;
      const forexRate = parseFloat(forexRateInput.value) || 1;
      const transport = parseFloat(transportInput.value) || 0;
      const profitPercent = parseFloat(profitInput.value) || 0;

      // debug log
      console.debug('PriceCalculator: calculating', { origPrice, forexRate, transport, profitPercent });

      const forexAdjusted = origPrice * forexRate;
      const subtotal = forexAdjusted + transport;
      const profitAmount = subtotal * (profitPercent / 100);
      const finalPrice = subtotal + profitAmount;

      resultOrigPrice.textContent = formatMoney(origPrice);
      resultForexPrice.textContent = formatMoney(forexAdjusted);
      resultTransportCost.textContent = formatMoney(transport);
      resultSubtotal.textContent = formatMoney(subtotal);
      resultProfitAmount.textContent = formatMoney(profitAmount) + ` (${profitPercent}%)`;
      resultFinalPrice.textContent = formatMoney(finalPrice);

      if (copyBtn) copyBtn.dataset.finalPrice = finalPrice;
    }

    // attach listeners (guarded)
    try {
      origPriceInput.addEventListener('input', calculatePrice);
      forexRateInput.addEventListener('input', calculatePrice);
      transportInput.addEventListener('input', calculatePrice);
      profitInput.addEventListener('input', calculatePrice);
    } catch (e) {
      console.error('PriceCalculator: error attaching input listeners', e);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function(e) {
        e.preventDefault();
        origPriceInput.value = '';
        forexRateInput.value = '1';
        transportInput.value = '';
        profitInput.value = '';
        calculatePrice();
        console.debug('PriceCalculator: reset clicked');
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        const finalPrice = parseFloat(copyBtn.dataset.finalPrice) || 0;
        if (finalPrice === 0) {
          alert('Please calculate a price first');
          return;
        }
        navigator.clipboard.writeText(finalPrice.toFixed(2)).then(() => {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
        }).catch(err => {
          console.error('PriceCalculator: copy failed', err);
          alert('Final Price: ' + finalPrice.toFixed(2));
        });
      });
    }

    // do initial calculation
    calculatePrice();
    console.log('PriceCalculator: initialized');
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initCalculator();
    });
  } else {
    initCalculator();
  }

  // Re-init when calculator tab is shown (Bootstrap event)
  document.addEventListener('shown.bs.tab', function(e) {
    // e.target is the activated tab (button)
    if (e.target && e.target.id === 'calculator-tab') {
      // small timeout to let pane become visible
      setTimeout(initCalculator, 50);
    }
  });
})();
