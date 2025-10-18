(async function() {
    function log(msg, ...rest) { console.log(`[AutoLogin] ${msg}`, ...rest); }

    // Reusable function to wait for any of a set of selectors
    function waitForAnySelector(selectors, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const interval = setInterval(() => {
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        clearInterval(interval);
                        log(`Found element for selector: ${selector} after`, ((Date.now() - start) / 1000).toFixed(2), 'seconds.');
                        resolve({ selector, element });
                        return;
                    }
                }
                if (Date.now() - start > timeout) {
                    clearInterval(interval);
                    reject('None of the expected fields appeared within timeout.');
                }
            }, 200);
        });
    }

    // A generic "Next" button click utility
    function clickNextButton(timeout = 2000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const interval = setInterval(() => {
                const nextButton = document.querySelector('button[type="submit"][data-testid="primaryButton"]');
                if (nextButton) {
                    clearInterval(interval);
                    nextButton.click();
                    resolve(true);
                    return;
                }
                if (Date.now() - start > timeout) {
                    clearInterval(interval);
                    reject('Next button not found for click.');
                }
            }, 100);
        });
    }

    // Fill logic utility
    const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    function fillInput(inputElement, value) {
        nativeValueSetter.call(inputElement, value);
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // --- Waiter Functions ---
    function waitForYearInput(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const interval = setInterval(() => {
                // Corrected ID to floatingLabelInput21
                const yearInput = document.querySelector('input[type="number"][name="BirthYear"][id="floatingLabelInput21"]');
                if (yearInput) {
                    clearInterval(interval);
                    log('Year input found.');
                    resolve(yearInput);
                }
                if (Date.now() - start > timeout) {
                    clearInterval(interval);
                    reject('Year input did not appear');
                }
            }, 200);
        });
    }

    function waitForMonthOptions(timeout) { return new Promise((resolve, reject) => {
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
      }); }

    function waitForDayDropdown(timeout) { return new Promise((resolve, reject) => {
        const start = Date.now();
        const interval = setInterval(() => {
          const dropdownBtn = document.getElementById('BirthDayDropdown');
          if (dropdownBtn) {
            clearInterval(interval);
            resolve(dropdownBtn);
          }
          if (Date.now() - start > timeout) {
            clearInterval(interval);
            reject('Day dropdown did not appear within timeout.');
          }
        }, 200);
      }); }

    function waitForDayOptions(timeout) { return new Promise((resolve, reject) => {
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
      }); }
      
    // --- Initial Setup ---
    let userEmail = prompt("Please enter your email:");
    if (!userEmail) {
        log("No email provided. Exiting script.");
        return;
    }

    const emailInput = document.querySelector('input[type="email"][name="New email"]');
    if (!emailInput) return log('Email input not found!');
    fillInput(emailInput, userEmail);
    log('Email filled.');

    const nextButton1 = document.querySelector('button[type="submit"][data-testid="primaryButton"]');
    if (!nextButton1) return log('Next button (after email) not found!');
    nextButton1.click();
    log('Clicked Next after email.');

    // --- Selectors (Password ID corrected) ---
    const passwordSelector = 'input[type="password"]#floatingLabelInput11'; 
    const monthDropdownSelector = '#BirthMonthDropdown';
    const firstNameSelector = 'input[type="text"]#firstNameInput[name="firstNameInput"]';

    // --- MAIN FLOW: Wait for next step ---
    try {
        const { selector, element } = await waitForAnySelector([
            passwordSelector,
            monthDropdownSelector,
            firstNameSelector
        ]);

        // --- PASSWORD FLOW (Login) ---
        if (selector === passwordSelector) {
            fillInput(element, 'Appus123/');
            log('Password filled.');
            
            await new Promise(res => setTimeout(res, 200));
            await clickNextButton();
            log('Clicked Next after password.');
            
            // Wait for follow-up registration steps (DOB/Name)
            try {
                const result = await waitForAnySelector([
                    monthDropdownSelector,
                    firstNameSelector
                ], 5000);
                await handleRegistrationSteps(result.selector, result.element);
            } catch (e) {
                log('Login flow complete or landed on final page.');
            }

        } 
        
        // --- SIGN UP FLOW (DOB/Name) ---
        else if (selector === monthDropdownSelector || selector === firstNameSelector) {
            await handleRegistrationSteps(selector, element);
        }

    } catch (err) {
        log('Main flow failed:', err);
    }

    // --- Helper to handle registration steps ---
    async function handleRegistrationSteps(currentSelector, currentElement) {
        
        // --- DOB: Month (Random) ---
        if (currentSelector === '#BirthMonthDropdown') {
            const monthDropdownBtn = currentElement;
            monthDropdownBtn.click();
            
            const monthOptions = await waitForMonthOptions(2500); 
            const randomMonth = monthOptions[Math.floor(Math.random() * monthOptions.length)];
            randomMonth.click();
            log('Selected random month:', randomMonth.textContent.trim());

            // --- DOB: Day (Random) ---
            const dayDropdownBtn = await waitForDayDropdown(5000);
            dayDropdownBtn.click();
            
            const dayOptions = await waitForDayOptions(2500);
            const randomDay = dayOptions[Math.floor(Math.random() * dayOptions.length)];
            randomDay.click();
            log('Selected random day:', randomDay.textContent.trim());

            // --- DOB: Year (Default) ---
            const yearInput = await waitForYearInput(5000); 
            fillInput(yearInput, '1999');
            log('Set year to 1999'); 

            await new Promise(res => setTimeout(res, 250));
            await clickNextButton();
            log('Clicked Next on DOB step.');

            // --- WAIT FOR NAME STEP (15s Timeout) ---
            try {
                log('Waiting for Name step (15s timeout)...');
                // Increased timeout to ensure the element appears after DOB submission
                const { selector, element: firstNameInput } = await waitForAnySelector([firstNameSelector], 15000); 
                currentSelector = selector;
                currentElement = firstNameInput;
            } catch (e) {
                log('Name step did not appear after DOB. Assuming flow complete.');
                return; 
            }
        }

        // --- Name Step (Default) ---
        if (currentSelector === firstNameSelector) {
            const firstNameInput = currentElement;
            const lastNameInput = document.querySelector('input[type="text"]#lastNameInput[name="lastNameInput"]'); 
            if (!lastNameInput) return log('Last name input not found. Skipping name step completion.');

            fillInput(firstNameInput, 'Appu');
            log('First name entered.');
            
            fillInput(lastNameInput, 'john');
            log('Last name entered.');

            await new Promise(res => setTimeout(res, 250));
            await clickNextButton();
            log('Clicked Next on Name step.');
        }
    }
})();
