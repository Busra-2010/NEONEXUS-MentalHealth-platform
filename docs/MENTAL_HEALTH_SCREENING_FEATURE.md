# Mental Health Screening Section - Student Dashboard

## What’s Been Added

The Student Dashboard now includes a comprehensive Mental Health Screening section where students can take standardized psychological assessments such as PHQ-9 and GAD-7.

---

## Key Features

### Assessment Types Available

1. **PHQ-9 (Depression Screening)**

   * 9 questions assessing depression symptoms
   * Scoring range: 0–27
   * Risk levels: Minimal, Mild, Moderate, Moderately Severe, Severe
   * Duration: 5–7 minutes

2. **GAD-7 (Anxiety Screening)**

   * 7 questions assessing anxiety symptoms
   * Scoring range: 0–21
   * Risk levels: Minimal, Mild, Moderate, Severe
   * Duration: 3–5 minutes

---

## User Interface

* Clean and structured interface suitable for assessment workflows
* Progress tracking via a visual progress bar
* Sequential question navigation with validation
* Results display with scoring and risk level indicators
* Actionable recommendations based on outcomes

---

## How It Works

### Step 1: Access Screening

```
Student Dashboard → Mental Health Screening
Sidebar → Take Assessments
Direct route → /screening
```

### Step 2: Choose Assessment

* Select PHQ-9 or GAD-7
* Displays last completion date if previously taken

### Step 3: Complete Questions

* One question per screen
* 4-point response scale
* Mandatory selection before proceeding

### Step 4: View Results

* Immediate score calculation
* Risk level classification
* Color-coded feedback

### Step 5: Follow-up Actions

* Low risk: General wellness suggestions
* Medium risk: Self-help recommendations
* High risk: Counseling recommendation
* Critical level: Immediate professional support advised

---

## Visual Design

### Dashboard Integration

```
Quick Actions
- Mental Health Screening
- Chat Support
- Book Session
- Browse Resources
```

### Sidebar Reminder

```
Mental Health Screening
Complete PHQ-9 and GAD-7 assessments
[Take Assessments]
```

---

## Technical Implementation

### Files Created

1. `src/components/assessments/MentalHealthScreening.tsx`

   * Core assessment logic
   * Question flow, scoring, and results display

2. `src/pages/MentalHealthScreening.tsx`

   * Dedicated screening page
   * Navigation and history integration

### Files Modified

1. `src/pages/StudentDashboard.tsx`

   * Added screening access points
   * Included visual indicators

2. `src/App.tsx`

   * Added `/screening` route
   * Protected route integration

---

## Features

### Assessment Engine

* Sequential question handling
* Response validation
* Automatic score calculation
* Risk classification logic

### User Experience

* Progress tracking
* Navigation controls
* Immediate feedback
* Assessment history tracking
* Confidentiality indicators

### Safety Features

* Identification of high-risk responses
* Counseling recommendations
* Emergency resource guidance
* Disclaimer for non-diagnostic use

---

## Student Benefits

### Early Detection

* Identifies mental health concerns early
* Uses standardized assessment tools

### Self-Awareness

* Provides measurable insights
* Enables tracking over time

### Appropriate Care

* Suggests support based on risk level
* Links to counseling and resources

### Privacy and Safety

* Confidential handling of results
* Optional anonymity
* Structured clinical approach

---

## Access Points

* Dashboard Quick Actions
* Sidebar reminder
* Direct route `/screening`
* Navigation menu

---

## Visual Indicators

* Highlighted screening action
* Importance badge
* Color-coded results
* Progress indicators during assessment

---

## Next Steps

* Assessment analytics and reporting
* Periodic screening reminders
* Trend analysis over time
* Integration with counselor workflows
* Improved mobile responsiveness

---

This feature provides structured, clinically informed mental health assessments within an accessible and user-friendly interface.
