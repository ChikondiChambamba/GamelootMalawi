// Price calculator initializer moved to external file to avoid CSP inline script blocking
(function(){
  function initCalculator() {
    const origPriceInput = document.getElementById('origPrice');
    const forexRateInput = document.getElementById('forexRate');
    const weightKgInput = document.getElementById('weightKg');
    const pricePerWeightInput = document.getElementById('pricePerWeight');
    const fixedTaxInput = document.getElementById('fixedTax');
    const transportInput = document.getElementById('transportCost');
    const profitInput = document.getElementById('profitPercent');
    const defaultPricePerWeightInput = document.getElementById('defaultPricePerWeight');
    const defaultFixedTaxInput = document.getElementById('defaultFixedTax');

    const resultOrigPrice = document.getElementById('resultOrigPrice');
    const resultForexPrice = document.getElementById('resultForexPrice');
    const resultWeightCharge = document.getElementById('resultWeightCharge');
    const resultFixedTax = document.getElementById('resultFixedTax');
    const resultTransportCost = document.getElementById('resultTransportCost');
    const resultSubtotal = document.getElementById('resultSubtotal');
    const resultProfitAmount = document.getElementById('resultProfitAmount');
    const resultFinalPrice = document.getElementById('resultFinalPrice');

    const resetBtn = document.getElementById('resetCalcBtn');
    const copyBtn = document.getElementById('copyPriceBtn');

    if (
      !origPriceInput ||
      !forexRateInput ||
      !weightKgInput ||
      !pricePerWeightInput ||
      !fixedTaxInput ||
      !transportInput ||
      !profitInput ||
      !resultOrigPrice ||
      !resultForexPrice ||
      !resultWeightCharge ||
      !resultFixedTax ||
      !resultTransportCost ||
      !resultSubtotal ||
      !resultProfitAmount ||
      !resultFinalPrice
    ) {
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
      const weightKg = parseFloat(weightKgInput.value) || 0;
      const pricePerWeight = parseFloat(pricePerWeightInput.value) || 0;
      const fixedTax = parseFloat(fixedTaxInput.value) || 0;
      const transport = parseFloat(transportInput.value) || 0;
      const profitPercent = parseFloat(profitInput.value) || 0;

      const forexAdjusted = origPrice * forexRate;
      const weightCharge = weightKg * pricePerWeight;
      const subtotal = forexAdjusted + weightCharge + fixedTax + transport;
      const profitAmount = subtotal * (profitPercent / 100);
      const finalPrice = subtotal + profitAmount;

      resultOrigPrice.textContent = formatMoney(origPrice);
      resultForexPrice.textContent = formatMoney(forexAdjusted);
      resultWeightCharge.textContent = formatMoney(weightCharge);
      resultFixedTax.textContent = formatMoney(fixedTax);
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
      weightKgInput.addEventListener('input', calculatePrice);
      pricePerWeightInput.addEventListener('input', calculatePrice);
      fixedTaxInput.addEventListener('input', calculatePrice);
      transportInput.addEventListener('input', calculatePrice);
      profitInput.addEventListener('input', calculatePrice);
    } catch (e) {
      // no-op
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function(e) {
        e.preventDefault();
        origPriceInput.value = '';
        forexRateInput.value = '1';
        weightKgInput.value = '0';
        pricePerWeightInput.value = defaultPricePerWeightInput ? defaultPricePerWeightInput.value : '52500';
        fixedTaxInput.value = defaultFixedTaxInput ? defaultFixedTaxInput.value : '36000';
        transportInput.value = '';
        profitInput.value = '';
        calculatePrice();
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
          alert('Final Price: ' + finalPrice.toFixed(2));
        });
      });
    }

    if (defaultPricePerWeightInput && pricePerWeightInput) {
      defaultPricePerWeightInput.addEventListener('input', function() {
        pricePerWeightInput.value = this.value;
        calculatePrice();
      });
    }

    if (defaultFixedTaxInput && fixedTaxInput) {
      defaultFixedTaxInput.addEventListener('input', function() {
        fixedTaxInput.value = this.value;
        calculatePrice();
      });
    }

    // do initial calculation
    calculatePrice();
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
