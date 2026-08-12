# Firebase Hosting Setup — JobTrack

JobTrack's frontend is a static site hosted on Firebase Hosting from the
`frontend/` directory.

This repo already includes the Hosting config:

- `frontend/firebase.json`
- `frontend/.firebaserc.example`

The remaining steps require your Firebase account.

---

## 1. Create the Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project**.
3. Use `jobtrack` as the project name if available.
4. Google Analytics is optional for now; you can leave it off.
5. Wait for the project to finish provisioning.

Record the **Project ID**. You will use it in `.firebaserc`.

---

## 2. Sign in to the Firebase CLI

From the repo root:

```powershell
npm exec --yes firebase-tools -- login
```

If the browser login flow succeeds, verify with:

```powershell
npm exec --yes firebase-tools -- projects:list
```

---

## 3. Point the repo at your Firebase project

From the `frontend/` directory:

```powershell
copy .firebaserc.example .firebaserc
```

Then replace `your-firebase-project-id` in `.firebaserc` with the real project
ID from the Firebase Console.

Example:

```json
{
  "projects": {
    "default": "jobtrack-12345"
  }
}
```

---

## 4. Equivalent of `firebase init hosting`

This repo already has the generated Hosting config, so you do **not** need to
run the interactive wizard unless you want to regenerate it manually.

Current settings in `frontend/firebase.json`:

- `public: "."` so Firebase serves files directly from `frontend/`
- `cleanUrls: true`
- SPA rewrite from `**` to `/index.html`
- ignore rules for dotfiles and `node_modules`

If you prefer the wizard, run it from `frontend/` and keep the same answers:

```powershell
cd frontend
npm exec --yes firebase-tools -- init hosting
```

Use these choices:

- **Use an existing project**
- **Public directory:** `.`
- **Configure as a single-page app:** `Yes`
- **Set up automatic builds and deploys with GitHub:** `No`
- **Overwrite `index.html`:** `No`

---

## 5. Optional local preview

From `frontend/`:

```powershell
npm exec --yes firebase-tools -- emulators:start --only hosting
```

This serves the static frontend locally through Firebase Hosting.

---

## 6. Deploy later

When the frontend is ready for deployment:

```powershell
cd frontend
npm exec --yes firebase-tools -- deploy --only hosting
```

---

## 7. Checklist

- [ ] Firebase project created
- [ ] Firebase CLI login completed
- [ ] `frontend/.firebaserc` created from `.firebaserc.example`
- [ ] Real project ID added
- [ ] Optional local Hosting preview works

When those are done, Phase 0 Firebase setup is complete.
