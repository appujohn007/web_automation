(async function() {
  function log(msg, ...rest) { console.log(`[AutoLogin] ${msg}`, ...rest); }

  // ----------- Ask for Email (Interactive) -----------
  let userEmail = prompt("Please enter your email:");
  if (!userEmail) {
    log("No email provided. Exiting script.");
    return;
  }

  // ----------- Fill Email -----------
  const emailInput = document.querySelector('input[type="email"][name="New email"]');
  if (!emailInput) return log('Email input not found!');
  const nativeEmailSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeEmailSetter.call(emailInput, userEmail);
  emailInput.dispatchEvent(new Event('input', { bubbles: true }));
  log('Email filled.');

  // ----------- Click Next Button -----------
  const nextButton = document.querySelector('button[type="submit"][data-testid="primaryButton"]');
  if (!nextButton) return log('"Next" button not found!');
  nextButton.click();
  log('Clicked "Next" after email.');

  // ----------- Wait for Password Input -----------
  function waitForPasswordInput(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const passwordInput = document.querySelector('input[type="password"]#floatingLabelInput12');
        if (passwordInput) {
          clearInterval(interval);
          log('Password input appeared after', ((Date.now() - start) / 1000).toFixed(2), 'seconds.');
          resolve(passwordInput);
        }
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject('Password input did not appear within 10 seconds.');
        }
      }, 200);
    });
  }

  // ----------- Wait for Month Dropdown -----------
  function waitForMonthDropdown(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const monthDropdownBtn = document.getElementById('BirthMonthDropdown');
        if (monthDropdownBtn) {
          clearInterval(interval);
          log('Month dropdown appeared after', ((Date.now() - start) / 1000).toFixed(2), 'seconds.');
          resolve(monthDropdownBtn);
        }
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject('Month dropdown did not appear within 10 seconds.');
        }
      }, 200);
    });
  }

  // ----------- Wait for Month Options -----------
  function waitForMonthOptions(timeout = 2000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const options = Array.from(document.querySelectorAll('[role="option"],li,div'))
          .filter(el =>
            el.textContent.trim().match(/^(January|February|March|April|May|June|July|August|September|October|November|December)$/)
          );
        if (options.length) {
          clearInterval(interval);
          resolve(options);
        }
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject('Month options did not appear');
        }
      }, 100);
    });
  }

  // ----------- Wait for Day Dropdown -----------
  function waitForDayDropdown(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const dropdownBtn = document.getElementById('BirthDayDropdown');
        if (dropdownBtn) {
          clearInterval(interval);
          log('Day dropdown appeared after', ((Date.now() - start) / 1000).toFixed(2), 'seconds.');
          resolve(dropdownBtn);
        }
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject('Day dropdown did not appear within 10 seconds.');
        }
      }, 200);
    });
  }

  // ----------- Wait for Day Options -----------
  function waitForDayOptions(timeout = 2000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const options = Array.from(document.querySelectorAll('[role="option"],li,div'))
          .filter(el => /^\d{1,2}$/.test(el.textContent.trim()) && Number(el.textContent.trim()) >= 1 && Number(el.textContent.trim()) <= 31);
        if (options.length) {
          clearInterval(interval);
          resolve(options);
        }
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject('Day options did not appear');
        }
      }, 100);
    });
  }

  // ----------- Wait for Year Input -----------
  function waitForYearInput(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const yearInput = document.querySelector('input[type="number"][name="BirthYear"][id="floatingLabelInput22"]');
        if (yearInput) {
          clearInterval(interval);
          resolve(yearInput);
        }
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject('Year input did not appear');
        }
      }, 200);
    });
  }

  // ----------- Wait for First/Last Name Inputs -----------
  function waitForNameInputs(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const firstNameInput = document.querySelector('input[type="text"]#firstNameInput[name="firstNameInput"]');
        const lastNameInput = document.querySelector('input[type="text"]#lastNameInput[name="lastNameInput"]');
        if (firstNameInput && lastNameInput) {
          clearInterval(interval);
          log('Name fields appeared after', ((Date.now() - start) / 1000).toFixed(2), 'seconds.');
          resolve({ firstNameInput, lastNameInput });
        }
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject('Name fields did not appear within 10 seconds.');
        }
      }, 200);
    });
  }

  // ----------- Click Next Button (generic) -----------
  function clickNextButton(timeout = 2000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const nextButton = document.querySelector('button[type="submit"][data-testid="primaryButton"]');
        if (nextButton) {
          clearInterval(interval);
          nextButton.click();
          resolve(true);
        }
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject('"Next" button not found');
        }
      }, 100);
    });
  }

  try {
    // ----------- PASSWORD (Default) -----------
    const passwordInput = await waitForPasswordInput(10000);
    const nativePasswordSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativePasswordSetter.call(passwordInput, 'Appus123/');
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    log('Password filled.');
    await new Promise(res => setTimeout(res, 200));
    const nextButton2 = document.querySelector('button[type="submit"][data-testid="primaryButton"]');
    if (!nextButton2) return log('"Next" button (after password) not found!');
    nextButton2.click();
    log('Clicked "Next" after password.');

    // ----------- DOB: Month (Random) -----------
    const monthDropdownBtn = await waitForMonthDropdown(10000);
    monthDropdownBtn.click();
    const monthOptions = await waitForMonthOptions(2500);
    const randomMonth = monthOptions[Math.floor(Math.random() * monthOptions.length)];
    randomMonth.click();
    log('Selected random month:', randomMonth.textContent.trim());

    // ----------- DOB: Day (Random) -----------
    const dayDropdownBtn = await waitForDayDropdown(10000);
    dayDropdownBtn.click();
    const dayOptions = await waitForDayOptions(2500);
    const randomDay = dayOptions[Math.floor(Math.random() * dayOptions.length)];
    randomDay.click();
    log('Selected random day:', randomDay.textContent.trim());

    // ----------- DOB: Year (Default) -----------
    const yearInput = await waitForYearInput(5000);
    const nativeYearSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeYearSetter.call(yearInput, '1999');
    yearInput.dispatchEvent(new Event('input', { bubbles: true }));
    yearInput.dispatchEvent(new Event('change', { bubbles: true }));
    log('Set year to 1999');

    // Click Next after DOB
    await new Promise(res => setTimeout(res, 250));
    await clickNextButton();
    log('Clicked Next button on DOB step.');

    // ----------- Wait for Name Inputs (Default) -----------
    const { firstNameInput, lastNameInput } = await waitForNameInputs(10000);

    const nativeFirstNameSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeFirstNameSetter.call(firstNameInput, 'Appu');
    firstNameInput.dispatchEvent(new Event('input', { bubbles: true }));
    log('First name entered.');

    const nativeLastNameSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeLastNameSetter.call(lastNameInput, 'john');
    lastNameInput.dispatchEvent(new Event('input', { bubbles: true }));
    log('Last name entered.');

    // Click Next after Names
    await new Promise(res => setTimeout(res, 250));
    await clickNextButton();
    log('Clicked Next button on Name step.');

  } catch (err) {
    log(err);
  }
})();
