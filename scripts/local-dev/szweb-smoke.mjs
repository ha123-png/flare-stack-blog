import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { assertSafeLaunch, privatePath } from "./guard.mjs";
assertSafeLaunch();
const { chromium } = createRequire(import.meta.url)(process.env.LOCAL_PLAYWRIGHT_PATH);
const output=path.join(privatePath,"szweb-qa","final");
fs.mkdirSync(output,{recursive:true});
const report={at:new Date().toISOString(),pages:[],checks:[],errors:[],network:[],external:[]};
const browser=await chromium.launch({headless:true,executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",args:["--disable-background-networking"]});
const context=await browser.newContext({viewport:{width:1440,height:900},locale:"zh-CN",reducedMotion:"reduce",colorScheme:"light"});
await context.route("**/*",route=>{const u=new URL(route.request().url());if(!["localhost","127.0.0.1","[::1]"].includes(u.hostname)){report.external.push(u.origin+u.pathname);return route.abort();}return route.continue();});
const page=await context.newPage();
page.on("response",r=>report.network.push({url:r.url(),status:r.status(),type:r.request().resourceType()}));
page.on("pageerror",e=>report.errors.push(e.message));
page.on("console",m=>{if(m.type()==="error")report.errors.push(m.text());});
const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
async function visit(name,route,width=1440,screenshot=true){
 await page.setViewportSize({width,height:width>650?900:844});
 const response=await page.goto("http://localhost:3000"+route,{waitUntil:"networkidle",timeout:90000});
 assert.equal(response.status(),200,name+" HTTP");
 await page.locator(".sz-site").first().waitFor();
 if(route==="/archive")await page.locator(".sz-archive-range").filter({hasText:"全部文章"}).waitFor({timeout:30000});
 if(route.startsWith("/search?q="))await page.locator(".sz-search-result").first().waitFor();
 if(route.startsWith("/post/")) for(const img of await page.locator(".sz-post img").all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());}
 await page.evaluate(()=>scrollTo(0,0));
 const facts=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,main:document.querySelectorAll("main").length,title:document.title,bg:getComputedStyle(document.querySelector(".sz-site")).backgroundColor,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)}));
 assert.ok(facts.scrollWidth<=width+1,name+" overflow");assert.equal(facts.broken.length,0,name+" broken images");
 report.pages.push({name,route,...facts});
 if(screenshot){await page.screenshot({path:path.join(output,name+".png"),fullPage:true});await page.screenshot({path:path.join(output,name+"-viewport.png")});}
 console.log("PASS "+name);
}
try{
 for(const w of [1440,1280,1024,768,430,390,360,320])await visit("home-"+w,"/",w,[1440,768,390,320].includes(w));
 for(const [name,route] of [["articles","/posts"],["post","/post/edge-blog-in-a-weekend"],["search","/search?q=搜索"],["archive","/archive"],["tags","/tags"],["projects","/projects"],["project","/projects/atlas"],["about","/about"],["friends","/friend-links"],["login","/login"],["register","/register"],["forgot","/forgot-password"],["stress-post","/post/local-archive-stress-001"]]){
   await visit(name+"-1440",route);
   if(["articles","post","search","archive","tags","stress-post"].includes(name)) await visit(name+"-390",route,390);
 }
 await visit("post-768","/post/edge-blog-in-a-weekend",768);
 for(const route of ["/posts","/post/local-archive-stress-001","/search?q=搜索","/archive","/tags","/about","/friend-links","/login"])await visit("narrow-"+route.split("/")[1],route,320,false);
 await visit("archive-complete","/archive",1440,false);
 check("Archive counts all 245 published fixture posts",(await page.locator(".sz-archive-range").innerText()).includes("245"));
 check("Archive groups multiple years",await page.locator(".sz-archive-year").count()>1);
 await visit("articles-preview","/posts",1440,false);
 await page.getByRole("button",{name:"先读一段"}).first().click();
 await page.locator(".sz-preview-rail .sz-preview-body h3").waitFor();
 check("Preview reads actual article paragraphs",(await page.locator(".sz-preview-rail").innerText()).includes("我想要一个"));
 await page.screenshot({path:path.join(output,"articles-preview-1440.png"),fullPage:true});
 await page.locator(".sz-preview-rail").getByRole("link",{name:/阅读全文/}).click();await page.waitForURL("**/post/**");await page.goBack({waitUntil:"networkidle"});
 check("Back restores selected preview",await page.locator(".sz-preview-rail").count()===1);
 const before=await page.locator(".sz-article-row").count();await page.getByRole("button",{name:"加载更多文章"}).click();await page.waitForFunction(n=>document.querySelectorAll(".sz-article-row").length>n,before);
 check("Real cursor load-more",await page.locator(".sz-article-row").count()>before);
 await page.keyboard.press("Control+k");await page.locator(".sz-quick-search[open]").waitFor();await page.locator(".sz-quick-bottom a").click();await page.waitForURL("**/search**");await page.locator("#sz-search-input").waitFor();
 check("Ctrl+K autofocus",await page.locator("#sz-search-input").evaluate(e=>e===document.activeElement));
 await page.locator("#sz-search-input").fill("中文");await page.locator(".sz-search-result").first().waitFor();await page.keyboard.press("ArrowDown");
 check("Search arrow selection",!!await page.locator("#sz-search-input").getAttribute("aria-activedescendant"));await page.keyboard.press("Enter");await page.waitForURL("**/post/**");
 check("Search Enter opens article",page.url().includes("/post/"));
 await page.keyboard.press("Control+k");await page.locator(".sz-quick-search[open]").waitFor();await page.locator(".sz-quick-bottom a").click();await page.waitForURL("**/search**");await page.locator("#sz-search-input").fill("zzzz_no_matching_article_928");await page.getByText("没有匹配文章",{exact:true}).waitFor();check("Search empty state",true);
 await page.getByRole("button",{name:"清除搜索内容"}).click();check("Search clear",await page.locator("#sz-search-input").inputValue()==="");await page.keyboard.press("Escape");await page.waitForURL("**/post/**");check("Escape returns to reading",true);
 await visit("menu-base","/",390,false);await page.getByRole("button",{name:"打开导航菜单"}).click();check("Mobile modal opens",await page.locator("#sz-mobile-menu").evaluate(e=>e.open));await page.screenshot({path:path.join(output,"navigation-390.png")});await page.keyboard.press("Escape");check("Mobile Escape restores focus",await page.getByRole("button",{name:"打开导航菜单"}).evaluate(e=>e===document.activeElement));
 await visit("appearance-base","/",1440,false);await page.locator(".sz-desktop-appearance summary").click();await page.locator(".sz-desktop-appearance").getByRole("button",{name:"深色",exact:true}).click();await page.locator(".sz-desktop-appearance summary").click();await page.reload({waitUntil:"networkidle"});check("Dark preference survives reload",await page.locator("html").evaluate(e=>e.classList.contains("dark")));await page.screenshot({path:path.join(output,"home-dark-1440.png"),fullPage:true});
 await page.locator(".sz-desktop-appearance summary").click();await page.locator(".sz-desktop-appearance").getByRole("button",{name:"浅色",exact:true}).click();await page.locator(".sz-desktop-appearance select").selectOption("en");await page.waitForLoadState("networkidle");await page.goto("http://localhost:3000/posts",{waitUntil:"networkidle"});check("English interface",await page.getByRole("heading",{name:"Articles",exact:true}).count()===1);await page.screenshot({path:path.join(output,"articles-english-1440.png")});
 await page.locator(".sz-desktop-appearance summary").click();await page.locator(".sz-desktop-appearance select").selectOption("zh");await page.waitForLoadState("networkidle");
 check("No external browser requests",report.external.length===0);
 check("No browser runtime errors",report.errors.length===0);
 const health=await context.request.get("http://localhost:3000/__local/health");report.health=await health.json();check("Worker outbound block counter remains zero",report.health.blockedOutbound===0);
 report.passed=true;
}catch(error){report.passed=false;report.failure=String(error);throw error;}
finally{fs.writeFileSync(path.join(output,"browser-report.json"),JSON.stringify(report,null,2));await browser.close();}
