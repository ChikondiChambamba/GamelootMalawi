# Price Calculator Testing & Debugging Guide

## Quick Test Steps

### 1. **Access the Calculator**
- Go to: `http://localhost:5000/admin`
- Log in if not already logged in (must be admin user)
- Click the **"Price Calculator"** tab (should see a calculator icon)

### 2. **Test Real-Time Calculation**
- **Enter Original Price:** Type `50000` in the first field
- **Watch the results:** The "Original Price" and all other fields should update immediately as you type
- **Try Forex Rate:** Change it to `1.05` → final price should update
- **Add Transport:** Type `5000` → totals should update
- **Set Profit %:** Type `25` → final price should change to reflect 25% profit

### 3. **Test the Reset Button**
- After entering values above, click the **"Reset"** button
- All fields should clear (Forex Rate should reset to `1`)
- All result values should show `0.00`

### 4. **Test Copy Button**
- Enter values again (e.g., 50000, 1.05, 5000, 25)
- The final selling price should appear in green
- Click **"Copy Final Price"** button
- Button text should change to "Copied!" for 2 seconds
- The price value is now in your clipboard and can be pasted elsewhere

---

## Debugging Information

### If the Calculator is NOT Working:

**1. Open Browser Console (Press F12 or Ctrl+Shift+I)**
- Go to "Console" tab
- You should see these log messages:
  ```
  Initializing calculator...
  Calculator elements found, setting up listeners
  Calculator initialized successfully
  ```

- When you type a value, you should see:
  ```
  Calculating: orig=50000, forex=1, transport=0, profit=0%
  ```

- When you click Reset, you should see:
  ```
  Reset button clicked
  ```

**2. If you DON'T see these messages:**
- Try clicking the "Price Calculator" tab again
- Check for errors in the console (red messages)
- Try refreshing the page (F5)

**3. If you see "Calculator elements not found":**
- The HTML elements may have a timing issue
- Try: Close the tab and reopen it
- Then click the Price Calculator tab

### Common Issues & Solutions:

| Issue | Solution |
|-------|----------|
| Buttons not visible | Refresh page (Ctrl+F5 to clear cache) |
| Calculator not calculating | Open console (F12), look for "Calculator initialized..." message |
| Reset button does nothing | Check console - should see "Reset button clicked" |
| Copy button shows error | Check that you've calculated a price first |
| Tab doesn't switch | Try refreshing page |

---

## What the Calculator Should Do

### Input Fields:
1. **Original Price** - Base cost of product (e.g., 50000)
2. **Forex Rate** - Exchange rate multiplier (e.g., 1.05)
3. **Transport & Shipping Cost** - Fixed shipping fee (e.g., 5000)
4. **Profit Margin (%)** - Desired profit percentage (e.g., 25)

### Output Display:
The calculator shows a breakdown:
- **Original Price:** 50,000.00
- **Forex Adjusted:** 52,500.00 (50000 × 1.05)
- **Transport Cost:** 5,000.00
- **Subtotal:** 57,500.00 (52500 + 5000)
- **Profit Amount:** 14,375.00 (57500 × 0.25)
- **Final Selling Price:** 71,875.00 ✅ (57500 + 14375)

### Formula:
```
Final Price = (Original Price × Forex Rate + Transport) × (1 + Profit% / 100)
```

---

## Example Calculation

**Scenario: Importing a Gaming Console from USA**

| Input | Value |
|-------|-------|
| Original Price (USD) | 500 |
| Forex Rate (USD→MWK) | 1050 |
| Transport & Handling | 150,000 |
| Profit Margin | 20% |

**Expected Output:**
- Original: 500.00
- Forex Adjusted: 525,000.00
- With Transport: 675,000.00
- With 20% Profit: **810,000.00** ← Final Price in MWK

---

## Browser Console Command

You can manually test the calculation by running this in the browser console:

```javascript
// Manual calculation test
const origPrice = 50000;
const forexRate = 1.05;
const transport = 5000;
const profitPercent = 25;

const forexAdj = origPrice * forexRate;
const subtotal = forexAdj + transport;
const profit = subtotal * (profitPercent / 100);
const finalPrice = subtotal + profit;

console.log('Original:', origPrice);
console.log('Forex Adjusted:', forexAdj);
console.log('With Transport:', subtotal);
console.log('Profit (25%):', profit);
console.log('FINAL PRICE:', finalPrice);
```

This should output: 71875

---

## Files Modified

- `views/pages/admin-price-calculator.ejs` - Enhanced with better error handling and logging
- `app.js` - Added admin dashboard route
- `views/partials/header.ejs` - Updated admin menu link
- `views/pages/admin-dashboard.ejs` - Created unified admin interface

---

## Next Steps

If calculator is working:
1. ✅ Test with different values
2. ✅ Copy the final price to clipboard
3. ✅ Reset and try new calculations
4. ✅ Use for actual product pricing!

If calculator is NOT working:
1. Check browser console for errors (F12)
2. Take a screenshot of the error messages
3. Try refreshing the page
4. Make sure you're logged in as admin
5. Check that `/admin` route loads correctly

---

## Support Information

**Files to reference:**
- Calculator HTML: `views/pages/admin-price-calculator.ejs` (lines 1-100: form and results)
- Calculator JS: `views/pages/admin-price-calculator.ejs` (lines 310-408: initialization code)
- Admin route: `app.js` (lines 842-876: route handler)
- Dashboard wrapper: `views/pages/admin-dashboard.ejs` (includes calculator in tab)

**Check the logs by:**
1. Press F12 → Console tab
2. Type in any field and watch for calculation logs
3. Click buttons and watch for corresponding logs
