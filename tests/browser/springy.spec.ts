import { expect, test, type Page } from '@playwright/test';

const lesson='/modules/java-oop/class-object-encapsulation/';

async function openPage(page: Page, url: string) {
  const response = await page.goto(url);
  await expect(page.getByTestId('sidebar-xp').first()).toHaveAttribute('data-ready','true');
  return response;
}

test('language switching keeps the lesson, progress, and notes',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(`${page.url()}: ${error.message}`));
  await openPage(page,lesson);
  await page.getByLabel('Catatan praktik',{exact:true}).fill('My cross-language practice note');
  await page.getByLabel('Catatan praktik',{exact:true}).blur();
  await page.locator('fieldset').first().getByRole('radio').first().check();
  await page.getByRole('button',{name:'Periksa jawaban',exact:true}).first().click();
  await expect(page.getByRole('status').first()).toContainText('Benar');
  await page.getByRole('navigation',{name:'Pilih bahasa',exact:true}).getByRole('link',{name:'English',exact:true}).click();
  await expect(page).toHaveURL(`/en${lesson}`);
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await expect(page.getByLabel('Practice notes',{exact:true})).toHaveValue('My cross-language practice note');
  await expect(page.getByText('You have already answered this question correctly.',{exact:false}).first()).toBeVisible();
  await page.getByRole('navigation',{name:'Choose language',exact:true}).getByRole('link',{name:'Bahasa Indonesia',exact:true}).click();
  await expect(page).toHaveURL(lesson);
  await expect(page.locator('html')).toHaveAttribute('lang','id');
  expect(errors).toEqual([]);
});

test('English navigation, search, and lab remain in English',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(`${page.url()}: ${error.message}`));
  await openPage(page,'/en/');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Learn Java and Spring Boot from the basics.');
  await page.screenshot({path:'test-results/springy-english-desktop.png',animations:'disabled',caret:'initial'});
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByPlaceholder('Search modules or lessons, e.g. transactions, circuit breaker').fill('transaction');
  await page.getByRole('option').first().click();
  await expect(page).toHaveURL(/\/en\/modules\//);
  await openPage(page,'/en/playground/api/');
  await page.getByRole('button',{name:'Send',exact:true}).click();
  await expect(page.getByText('HTTP 201',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Send',exact:true}).click();
  await expect(page.getByText('HTTP 200',{exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('CSP blocks injected scripts while the application hydrates',async({page})=>{
  const response=await openPage(page,'/en/');
  const headers=response!.headers();
  expect(headers['content-security-policy']).toContain("script-src 'self' 'sha256-");
  expect(headers['content-security-policy']).not.toMatch(/script-src[^;]*unsafe-(inline|eval)/);
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
  await page.evaluate(()=>{
    const script=document.createElement('script');
    script.textContent='window.__injected = true';
    document.body.append(script);
  });
  expect(await page.evaluate(()=>('__injected' in window))).toBe(false);
  // A working client control proves CSP did not disable hydration.
  await page.getByRole('radio',{name:'Dark',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});

test('imported HTML notes are displayed as text and never executed',async({page})=>{
  const payload='<img src=x onerror="window.__noteXss=true"><script>window.__noteXss=true</script>';
  await openPage(page,'/en/settings/');
  await page.locator('input[type=file]').setInputFiles({name:'notes.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:2,notes:{'m1-1':payload}}))});
  await expect(page.getByText('The file has been merged with your progress.')).toBeVisible();
  await openPage(page,'/en/notes/');
  await expect(page.getByText(payload,{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>('__noteXss' in window))).toBe(false);
  await expect(page.locator('img[src=x]')).toHaveCount(0);
});

test('mobile menu exposes the language switch without horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openPage(page,'/');
  await page.getByRole('button',{name:'Buka menu',exact:true}).click();
  await page.getByRole('dialog').getByRole('link',{name:'English',exact:true}).click();
  await expect(page).toHaveURL('/en/');
  await expect(page.getByRole('heading',{level:1})).toContainText('Learn Java');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/springy-english-mobile.png',animations:'disabled',caret:'initial'});
});

test('XP, daily challenge, badges, and level-up work across languages without duplicate rewards',async({page})=>{
  await openPage(page,`/en${lesson}`);
  const questions=page.locator('fieldset');
  await questions.nth(0).getByRole('radio').nth(1).check();
  await page.getByRole('button',{name:'Check answer',exact:true}).first().click();
  await expect(page.getByTestId('sidebar-xp').first()).toHaveText('0 XP');
  await expect(page.getByTestId('reward-toast')).toHaveCount(0);
  await questions.nth(0).getByRole('radio').first().check();
  await page.getByRole('button',{name:'Check answer',exact:true}).first().click();
  await expect(page.getByTestId('reward-toast')).toContainText('+20 XP');
  await page.getByRole('button',{name:'Dismiss celebration',exact:true}).click();
  await page.getByRole('button',{name:'Check answer',exact:true}).first().click();
  await expect(page.getByTestId('sidebar-xp').first()).toHaveText('20 XP');
  await expect(page.getByTestId('reward-toast')).toHaveCount(0);
  await questions.nth(1).getByRole('radio').first().check();
  await page.getByRole('button',{name:'Check answer',exact:true}).nth(1).click();
  await page.getByRole('textbox',{name:/Complete Order:/}).fill(`import java.math.BigDecimal;
public class Order {
  private final BigDecimal total;
  public Order(BigDecimal total) {
    if (total.signum() < 0) throw new IllegalArgumentException("Negative total");
    this.total = total;
  }
  public BigDecimal total() { return total; }
}`);
  await page.getByRole('button',{name:'Check code',exact:true}).click();
  await expect(page.getByTestId('reward-toast')).toContainText('Level up!');
  await expect(page.getByTestId('sidebar-xp').first()).toHaveText('110 XP');
  await openPage(page,'/en/');
  await expect(page.getByTestId('total-xp')).toHaveText('110');
  await expect(page.getByTestId('daily-progress')).toHaveText('2/2');
  await page.getByRole('button',{name:/First bloom/}).click();
  await expect(page.locator('.badge-detail')).toContainText('Complete one lesson.');
  await page.getByRole('heading',{name:'Your adventure'}).evaluate(el=>el.scrollIntoView({block:'start'}));
  await page.screenshot({path:'test-results/springy-adventure.png',animations:'disabled',caret:'initial'});
  await page.getByRole('navigation',{name:'Choose language',exact:true}).getByRole('link',{name:'Bahasa Indonesia',exact:true}).click();
  await expect(page.getByTestId('total-xp')).toHaveText('110');
  await expect(page.getByRole('heading',{name:'Petualanganmu'})).toBeVisible();
});

test('Springy responds to taps and calm mode persists',async({page})=>{
  await openPage(page,'/en/');
  const mascot=page.getByRole('button',{name:'Say hi to Springy',exact:true});
  await mascot.hover();
  await mascot.click();
  await expect(page.getByText('Hi! Ready to learn together?',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Animations',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion','off');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-motion','off');
  expect(await page.locator('.springy-character').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await page.getByRole('button',{name:'Say hi to Springy',exact:true}).click();
  await expect(page.getByText('Hi! Ready to learn together?',{exact:true})).toBeVisible();
});

test('device reduced-motion preference disables animation while keeping rewards accessible',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await openPage(page,`/en${lesson}`);
  await expect(page.getByRole('button',{name:'Animations',exact:true})).toHaveAttribute('aria-pressed','false');
  await page.locator('fieldset').first().getByRole('radio').first().check();
  await page.getByRole('button',{name:'Check answer',exact:true}).first().click();
  await expect(page.getByTestId('reward-toast')).toBeVisible();
  await expect(page.locator('.celebration-particles')).toBeHidden();
  expect(await page.getByTestId('reward-toast').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});
