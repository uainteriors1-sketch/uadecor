# UA Interiors Store — Complete Setup Guide
## Supabase + Vercel + Domain Connection

---

## TOTAL TIME: ~2 hours (one-time setup)

---

## STEP 1: Supabase Setup (20 min)

### 1.1 Account Banao
- Go to: https://supabase.com
- "Start your project" → GitHub se sign in karo
- "New Project" click karo
- Name: `ua-interiors`
- Password: strong password likho (save karo somewhere)
- Region: `Southeast Asia (Singapore)` — Mumbai ke sabse paas
- "Create new project" → 2-3 min wait karo

### 1.2 Database Tables Banao
- Left sidebar → "SQL Editor"
- "New Query" click karo
- `supabase/schema.sql` file ka POORA content copy karo
- Paste karo → "Run" button click karo
- Green checkmark aayega — tables ready!

### 1.3 Admin User Banao
- Left sidebar → "Authentication" → "Users"
- "Add User" → "Create new user"
- Email: `datta@uainteriors.in` (ya jo bhi tumhara email hai)
- Password: strong password (yahi se login hoga)
- "Create User" click karo

### 1.4 API Keys Copy Karo
- Left sidebar → "Settings" → "API"
- Copy karo aur save karo:
  - `Project URL` (starts with https://xxx.supabase.co)
  - `anon public` key (long string)

---

## STEP 2: Project Setup (10 min)

### 2.1 Files Download
- Is guide ke saath jo `ua-store` folder mila hai — usse apne computer pe rakho

### 2.2 .env File Banao
- `ua-store` folder mein `.env.example` file hai
- Uski copy banao, naam rakho `.env`
- Fill karo:
```
VITE_SUPABASE_URL=https://imzbcfaymiftszhlntnu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltemJjZmF5bWlmdHN6aGxudG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTY1MDksImV4cCI6MjA5ODM5MjUwOX0.GoCFEuNMFQGxLSiFf8akmfKK9uthcIvAEWVMHg1wL8s
VITE_ADMIN_EMAIL=uainteriors1@gmail.com
```

### 2.3 WhatsApp Number Update Karo
- `src/pages/Shop.jsx` file kholein
- Line 6 mein: `const WA_NUMBER = '91XXXXXXXXXX'`
- Apna actual number daalo: `'919XXXXXXXXX'` (91 + 10 digit number)

---

## STEP 3: GitHub Setup (15 min)

### 3.1 GitHub Account
- https://github.com → Sign up (free)

### 3.2 New Repository
- "New repository" → Name: `ua-store`
- Private repository select karo
- "Create repository"

### 3.3 Files Upload
**Option A (Easy — No coding knowledge needed):**
- GitHub repository page pe → "uploading an existing file" link
- `ua-store` folder ke SAARE files drag & drop karo
- "Commit changes" click karo

**Option B (If you have VS Code):**
```bash
cd ua-store
git init
git add .
git commit -m "UA Store initial"
git remote add origin https://github.com/YOUR_USERNAME/ua-store.git
git push -u origin main
```

---

## STEP 4: Vercel Deployment (10 min)

### 4.1 Vercel Account
- https://vercel.com → "Sign Up" → GitHub se login karo

### 4.2 Import Project
- Vercel Dashboard → "New Project"
- GitHub repository `ua-store` select karo → "Import"

### 4.3 Environment Variables Add Karo
- "Environment Variables" section mein:
  - Name: `VITE_SUPABASE_URL` → Value: tumhara Supabase URL
  - Name: `VITE_SUPABASE_ANON_KEY` → Value: tumhara anon key
- "Deploy" click karo
- 2-3 min mein deploy ho jaayega
- Vercel ek URL dega: `ua-store-xxx.vercel.app` — yeh live hai!

---

## STEP 5: Domain Connect Karo (20 min)

### 5.1 UAinteriors.in Connect
- Vercel → Project → "Settings" → "Domains"
- "Add Domain" → `uainteriors.in` type karo → "Add"
- Vercel tumhe 2 records dega (CNAME ya A record)

- Tumhara domain registrar kholein (GoDaddy/BigRock/Namecheap)
- DNS Settings → Add records jo Vercel ne diye:
  - `@` A record → Vercel IP
  - `www` CNAME → `cname.vercel-dns.com`
- Save karo → 30 min se 2 hours mein propagate hoga

### 5.2 sarvadnyainteriors.com Connect (Option 1 — Separate deployment)
- Vercel mein same project ke liye second domain add karo
- "Add Domain" → `sarvadnyainteriors.com`
- Same DNS changes karo for this domain too

### 5.2 sarvadnyainteriors.com (Option 2 — Embed karo)
- Agar sarvadnya site alag platform pe hai (WordPress etc)
- Shop page ko embed karo via iframe:
```html
<iframe 
  src="https://uainteriors.in/shop" 
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border:none;">
</iframe>
```

---

## STEP 6: Facebook Product Feed Setup (15 min)

### 6.1 XML Feed URL
- Tumhara feed URL: `https://uainteriors.in/fb-feed.xml`
- NOTE: Abhi yeh static export hai — Admin Products → Export → Copy XML → Save as .xml file → Upload to Vercel public folder

### 6.2 Facebook Commerce Manager
- https://business.facebook.com → Commerce Manager
- "Catalogs" → "Create Catalog" → Home & Garden
- "Data Sources" → "Data Feed" → "Upload" → Upload the XML file
- "Schedule" → Daily update set karo
- Ek baar connect hone ke baad Instagram Shopping automatic

---

## STEP 7: How to Use Daily (5 min)

### Admin Panel:
- URL: `https://uainteriors.in/admin`
- Login: Supabase mein banaya email + password
- Products: Add/edit/delete products — auto NEW badge 30 days
- Orders: New order create, status update, WhatsApp messages

### Customer Shop:
- URL: `https://uainteriors.in/shop` ya `https://uainteriors.in`
- Public — koi bhi dekh sakta hai
- WhatsApp to Order button har product pe

### Weekly Routine (4 hours total):
- Monday: New products add karo (admin panel)
- Wednesday: Content schedule karo
- Daily: Orders check karo — status update karo
- Friday: Payments confirm karo

---

## STEP 8: 2 Claude Dashboard Files — How to Use

### UA_Catalogue_Manager.jsx:
- Claude.ai pe open karo — yeh Claude ke andar chalti hai
- **Daily use**: WhatsApp broadcast export karo (one tap copy)
- **Stock check**: Out of stock toggle karo
- **Reference**: Sabhi products ki supplier + margin info
- Data Claude ke andar save rehta hai (persistent storage)

### UA_Ops_Complete.jsx:
- Claude.ai pe open karo
- **Order SOP**: Jab bhi naya order aaye — 8 steps follow karo
- **Bundles**: Client ko pitch karte waqt reference
- **Canton Fair**: October se pehle yeh guide follow karo
- **Automation**: Weekly schedule pin karke rakhna

### Dono ka relation:
```
Supabase Webapp (main system)
    ↓ orders, products, delivery tracking
Claude Dashboards (reference tools)
    ↓ WhatsApp exports, SOPs, supplier info
Together = Complete business operation
```

---

## TROUBLESHOOTING

**Login nahi ho raha:**
- Supabase → Authentication → Users → check email exactly correct hai

**Products dikh nahi rahe:**
- Supabase → Table Editor → products table check karo
- `is_available` column `true` hai?

**Domain connect nahi hua:**
- DNS propagation 24 hours tak le sakta hai — patience rakho
- Vercel dashboard mein "Check" button click karo status ke liye

**Build fail on Vercel:**
- Environment variables check karo — VITE_ prefix mandatory
- `.env` file GitHub pe push mat karo (already in .gitignore)

---

## SUPPORT

Koi bhi issue aaye toh Claude mein poochho — code, deployment, ya koi bhi step.

---

*UA Interiors Store v1.0 | uainteriors.in | sarvadnyainteriors.com*
