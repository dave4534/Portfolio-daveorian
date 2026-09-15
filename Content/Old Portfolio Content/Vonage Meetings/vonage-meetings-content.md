# Vonage Meetings — Portfolio Case Study

> Source: Dave Orian's old portfolio (Webflow), page "Vonage Meetings"
> Extracted in visual/DOM order, with page hierarchy preserved.

## Site navigation (top nav, sticky)

- **Dave Orian** (logo/home link) → `/`
- CV → https://drive.google.com/file/d/19i2iU_uEzZHtscwUIS_jOexJwxok70XU/view
- LinkedIn → https://www.linkedin.com/in/daveorian/
- About me → `/about-me`

## Project header

![Vonage Logo](images/01_vonage-logo.svg)  |  **Meetings**

### PROJECT OVERVIEW *(eyebrow/label)*

**Vonage Meetings combines video meetings, live collaboration and recording for small and large businesses.** *(large bold headline)*

![Hero image — Vonage Meetings video call UI](images/02_hero.png)

---

## 1 — Example user flow

### Creating a new Meeting

Vonage Business Cloud (VBC) is a cloud communications solution for small and large businesses. Communication is the pain that Vonage wants to solve, and naturally many customers asked for a Video Conferencing solution.

To create a new Meeting, users navigate to the "Meetings" product within VBC and click on "New Meeting".

![Meetings product view within VBC](images/03_flow-1.2.png)

Vonage Business Cloud (VBC) is a cloud communications solution for small and large businesses. Communication is the pain that Vonage wants to solve, and naturally many customers asked for a Video Conferencing solution.

*(Note: the paragraph above appears twice in the source page, once before and once after the step‑2 image — likely an authoring duplicate in the original site.)*

![New Meeting modal — choose participants / share dial-in info](images/04_flow-2.1.png)

Upon clicking "New Meeting", a modal is displayed where the user can invite others or copy the Meeting info to share with others.

![Live meeting screen with side panel](images/05_flow-3.png)

*Caption: A live Meeting. Call actions can be controlled on the top part of the screen; The side panel allows the user to easily access a wide range of actions quickly.*

From the moment a user is in a Meeting, the side navigation is their main tool to navigate the Meeting. In the stages the preceded GA (General Availability) we received feedback from more than 200 users regarding Meetings and made adjustments to the side navigation according to much of that feedback.

---

## 2 — Before & after

### Redesigning the Meetings sidebar

The side navigation in a Meeting is critical—it's how users can navigate their Meetings experience. There were some challenges that users experienced and we dedicated a sprint to focus solely on the side navigation.

#### Side navigation: Before

![Side navigation before — variant 1](images/06_sidenav-old-1.png)
![Side navigation before — variant 2](images/07_sidenav-old-2.png)
![Side navigation before — variant 3](images/08_sidenav-old-3.png)

One of the changes that were made were the navigation icons. According to usability tests it wasn't clear to users what each tab icon represented. Icons are often thought of as ineffective labels, being very difficult to interpret correctly without training or experience, so the icons were replaced with text.

#### Side navigation: After

![Side navigation after — variant 1 (Participants)](images/09_sidenav-new-1.png)
![Side navigation after — variant 2 (Invite)](images/10_sidenav-new-2.png)
![Side navigation after — variant 3 (Settings)](images/11_sidenav-new-3.png)

After the Alpha stage of testing we also noticed that there is not enough differentiation between Participants' statuses - and we added two points of indication in the UI: Clearer separation of who is active and who is inactive in the Meeting, and if they are inactive what their sub-status is.

---

## 3 — Meetings mobile

### Translating the Meetings Desktop experience for mobile devices

**Flow A — Calls / New Meeting**

![Mobile flow A — screen 1 (Calls list)](images/12_mobile-a-1.png)
![Mobile flow A — screen 2 (New Call / New Meeting menu)](images/13_mobile-a-2.png)
![Mobile flow A — screen 3 (New Meeting — add participants)](images/14_mobile-a-3.png)
![Mobile flow A — screen 4 (Pre-call video/mute toggle)](images/15_mobile-a-4.png)
![Mobile flow A — screen 5 (Live call, two-up view)](images/16_mobile-a-5.png)

We wanted to [provide a] user experience that was consistent with the conventions of Meetings for Desktop. In both cases we provided the user with a prominent toolbar through which the users can edit the Participants of the Meeting or send Chat messages throughout the Meeting.

*(Note: source text reads "We wanted to user experience that was consistent..." — appears to be missing a word/typo in the original site copy; likely intended as "We wanted to provide a user experience...".)*

**Flow B — Manage Participants / Chat**

![Mobile flow B — screen 1 (Manage Participants — Add)](images/17_mobile-b-1.png)
![Mobile flow B — screen 2 (Manage Participants — recipients selected)](images/18_mobile-b-2.png)
![Mobile flow B — screen 3 (Invitations sent confirmation)](images/19_mobile-b-3.png)
![Mobile flow B — screen 4 (Share dial-in info)](images/20_mobile-b-4.png)
![Mobile flow B — screen 5 (Chat with file attachment)](images/21_mobile-b-5.png)

---

## Final thoughts

Within its first three months Vonage Meetings grew to facilitate over 100 Meetings per day growing at a rate of 15%. Meetings reached a significant milestone during Covid, as many worked from home and needed an integrated video conference solution for their company.

---

**NEXT PROJECT:** Vonage Receptionist → `/receptionist-app-for-desktop`
