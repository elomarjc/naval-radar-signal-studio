# Technical Outreach Package: Terma A/S & Naval Surveillance Radar DSP

## 1. Target Executive & Engineering Contacts
* **Primary Organization:** Terma A/S
* **Headquarters & Radar R&D Hub:** Hovmarken 4, 8520 Lystrup, Denmark (Aarhus Area)
* **Department:** *Radar & Sensor Systems R&D / Sensor Signal Processing*
* **Target Roles:**
  * Director of Radar R&D / Head of Sensor Software
  * Advanced Technical Specialist (Radar Signal Processing & Sensors)
  * Lead Systems Engineer, SCANTER Naval Surveillance
  * Radar Algorithm & Target Tracking Specialist
* **LinkedIn Boolean Search Query:**  
  `"Terma" AND ("Lystrup" OR "Aarhus" OR "Central Denmark") AND ("Radar" OR "Signal Processing" OR "CFAR" OR "Sensors") AND ("Director" OR "Lead" OR "Specialist" OR "Manager")`

---

## 2. Reverse-Engineered Cold Outreach Email

**Subject:** Interactive Radar Console: OS-CFAR Target Detection & Sea Clutter Mitigation

> Dear [First Name / Hiring Manager],
>
> In naval surveillance radars like the SCANTER series, extracting low-RCS surface craft in severe sea clutter environments requires balancing false alarm rates against target masking in multi-target interference environments.
>
> To explore these algorithms hands-on, I developed an interactive in-browser **SCANTER-Style Radar Signal Processing Console**:
>
> 🔗 **Live Simulator:** https://elomarjc.github.io/naval-radar-signal-studio/  
> 🔗 **Source Code & Mathematical Derivations:** https://github.com/elomarjc/naval-radar-signal-studio
>
> **Signal processing features implemented in the console:**
> * **Adaptive CFAR Detectors:** Real-time sliding window CA-CFAR, GO-CFAR, and Order-Statistic (OS-CFAR) with dynamic threshold multipliers ($\alpha$) calibrated to designated $P_{\text{fa}}$.
> * **Clutter Distribution Modeling:** Compound K-distribution and Weibull statistical generators simulating spiky sea clutter returns and sea-state swells.
> * **MTI Doppler Filtering:** 3-pulse canceler filter bank ($H(z) = (1 - z^{-1})^2$) rejecting zero-Doppler clutter and stationary land mass.
> * **Plan Position Indicator (PPI) & A-Scope:** 60 FPS hardware-accelerated polar radar sweep with target track formation.
>
> Having completed my Bachelor's Project in Electronic Engineering at Aalborg University focusing on digital signal processing, detection theory, and embedded simulation, I have immense admiration for Terma's radar engineering excellence in Lystrup.
>
> I would welcome the opportunity to share the project and hear your feedback on the CFAR order-statistic parameter selection.
>
> Best regards,  
> **Jacob El-Omar**  
> Aalborg, Denmark | +45 XX XX XX XX | [LinkedIn Profile URL]

---

## 3. High-Impact LinkedIn Post

```markdown
📡 Detecting Stealth Maritime Targets in Extreme Sea Clutter: Real-Time CFAR Radar DSP 🛰️

In naval radar surveillance, fixed detection thresholds fail: high sea states cause hundreds of false alarm flashes, while lowering sensitivity blinds the radar to small surface vessels (RHIBs, UAVs).

The solution is Constant False Alarm Rate (CFAR) processing—adapting detection thresholds dynamically based on surrounding noise statistics.

I built an interactive in-browser **Radar Signal Processing Console & PPI Scope** to demonstrate these algorithms:

🚀 Live Demo: https://elomarjc.github.io/naval-radar-signal-studio/
💻 GitHub Repo: https://github.com/elomarjc/naval-radar-signal-studio

Core Signal Processing Implementations:
1️⃣ Authentic PPI Radar Scope: 360° sweep visualizing radar returns, coastline geography, and moving maritime targets.
2️⃣ Adaptive CFAR Algorithms: Real-time sliding window comparison between Cell-Averaging (CA-CFAR), Greatest-Of (GO-CFAR), and Order-Statistic (OS-CFAR) to prevent target masking in multi-target environments.
3️⃣ Statistical Sea Clutter: Generates non-Gaussian Weibull and K-distributed sea returns with adjustable sea state (Douglas scale).
4️⃣ 3-Pulse MTI Doppler Filter: Attenuates stationary ground/sea clutter while preserving Doppler shifts from moving craft.

Experience the live radar sweep directly in your browser!

#Radar #SignalProcessing #DefenseTech #Terma #Aerospace #CFAR #DSP #ElectronicEngineering #AalborgUniversity
```
