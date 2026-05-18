'use client'

import { useState, useTransition } from 'react'
import { updateFitnessProfile } from '@/actions/fitness'
import { Dumbbell, Edit2, Check, Scale, Heart, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react'

interface FitnessProfile {
  height_cm: number | null
  weight_kg: number | null
  age: number | null
  sex: string | null
  fitness_level: string | null
  primary_goal: string | null
  secondary_goals: string[] | null
  available_equipment: string[] | null
  training_days_per_week: number | null
  experience_years: number | null
  injuries_limitations: string | null
}

interface Props {
  initialProfile: FitnessProfile | null
}

export function FitnessProfileSection({ initialProfile }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  // Form states
  const [height, setHeight] = useState(initialProfile?.height_cm?.toString() || '')
  const [weight, setWeight] = useState(initialProfile?.weight_kg?.toString() || '')
  const [age, setAge] = useState(initialProfile?.age?.toString() || '')
  const [sex, setSex] = useState(initialProfile?.sex || 'prefer_not_to_say')
  const [fitnessLevel, setFitnessLevel] = useState(initialProfile?.fitness_level || 'beginner')
  const [primaryGoal, setPrimaryGoal] = useState(initialProfile?.primary_goal || 'muscle_gain')
  const [equipmentInput, setEquipmentInput] = useState(initialProfile?.available_equipment?.join(', ') || '')
  const [trainingDays, setTrainingDays] = useState(initialProfile?.training_days_per_week?.toString() || '')
  const [experience, setExperience] = useState(initialProfile?.experience_years?.toString() || '')
  const [injuries, setInjuries] = useState(initialProfile?.injuries_limitations || '')

  // Calculate BMI
  const hNum = parseFloat(height)
  const wNum = parseFloat(weight)
  let bmi: number | null = null
  let bmiClass = ''
  let bmiColor = '#6b7280' // neutral
  let bmiBg = '#f3f4f6'

  if (!isNaN(hNum) && !isNaN(wNum) && hNum > 0 && wNum > 0) {
    const heightInMeters = hNum / 100
    bmi = wNum / (heightInMeters * heightInMeters)

    if (bmi < 18.5) {
      bmiClass = 'Underweight'
      bmiColor = '#3b82f6' // Blue
      bmiBg = '#eff6ff'
    } else if (bmi >= 18.5 && bmi < 25) {
      bmiClass = 'Normal Weight'
      bmiColor = '#10b981' // Green
      bmiBg = '#ecfdf5'
    } else if (bmi >= 25 && bmi < 30) {
      bmiClass = 'Overweight'
      bmiColor = '#f59e0b' // Orange
      bmiBg = '#fffbeb'
    } else {
      bmiClass = 'Obese'
      bmiColor = '#ef4444' // Red
      bmiBg = '#fef2f2'
    }
  }

  function handleSave() {
    setError('')
    setSaved(false)

    const parsedHeight = parseFloat(height)
    const parsedWeight = parseFloat(weight)
    const parsedAge = parseInt(age)
    const parsedDays = parseInt(trainingDays)
    const parsedExp = parseFloat(experience)

    const equipmentArray = equipmentInput
      ? equipmentInput.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
      : []

    startTransition(async () => {
      const res = await updateFitnessProfile({
        height_cm: isNaN(parsedHeight) ? undefined : parsedHeight,
        weight_kg: isNaN(parsedWeight) ? undefined : parsedWeight,
        age: isNaN(parsedAge) ? undefined : parsedAge,
        sex: sex || undefined,
        fitness_level: fitnessLevel || undefined,
        primary_goal: primaryGoal || undefined,
        available_equipment: equipmentArray,
        training_days_per_week: isNaN(parsedDays) ? undefined : parsedDays,
        experience_years: isNaN(parsedExp) ? undefined : parsedExp,
        injuries_limitations: injuries || undefined,
      })

      if (res && 'error' in res) {
        setError(res.error || 'Failed to save')
        return
      }

      setSaved(true)
      setIsEditing(false)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  function handleCancel() {
    setHeight(initialProfile?.height_cm?.toString() || '')
    setWeight(initialProfile?.weight_kg?.toString() || '')
    setAge(initialProfile?.age?.toString() || '')
    setSex(initialProfile?.sex || 'prefer_not_to_say')
    setFitnessLevel(initialProfile?.fitness_level || 'beginner')
    setPrimaryGoal(initialProfile?.primary_goal || 'muscle_gain')
    setEquipmentInput(initialProfile?.available_equipment?.join(', ') || '')
    setTrainingDays(initialProfile?.training_days_per_week?.toString() || '')
    setExperience(initialProfile?.experience_years?.toString() || '')
    setInjuries(initialProfile?.injuries_limitations || '')
    setIsEditing(false)
    setError('')
  }

  const goalLabels: Record<string, string> = {
    fat_loss: 'Fat Loss',
    muscle_gain: 'Muscle Gain',
    strength: 'Strength & Power',
    recomposition: 'Recomposition',
    posture: 'Posture & Mobility',
    endurance: 'Endurance',
  }

  const fitnessLevelLabels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border)', background: '#fff' }}>
      {/* Header and Toggle Button */}
      <div 
        onClick={() => { if (!isEditing) setIsExpanded(!isExpanded) }}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '16px 18px',
          cursor: isEditing ? 'default' : 'pointer',
          userSelect: 'none',
          transition: 'background 0.2s'
        }}
        onMouseEnter={e => { if (!isEditing) e.currentTarget.style.background = '#fafafa' }}
        onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = '#fff' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Dumbbell size={18} color="var(--em-600)" />
          <div>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Fitness Profile & BMI
            </span>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {initialProfile?.primary_goal 
                ? `${goalLabels[initialProfile.primary_goal] || initialProfile.primary_goal} · ${initialProfile.weight_kg}kg` 
                : 'Not configured yet'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--em-600)' }}>
              <Check size={12} /> Saved!
            </span>
          )}
          {!isEditing && (
            <button
              onClick={() => {
                setIsExpanded(true)
                setIsEditing(true)
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '12px', fontWeight: 600, color: 'var(--em-600)',
                padding: '4px 8px', borderRadius: '6px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--em-50)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              <Edit2 size={12} /> Edit
            </button>
          )}
          {!isEditing && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                padding: '4px', borderRadius: '50%',
                color: 'var(--text-muted)'
              }}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content View */}
      {isExpanded && (
        <div style={{ padding: '0 18px 20px', borderTop: '1px solid var(--border-light)', animation: 'slideDown 0.2s ease-out' }}>
          
          {/* Automatic BMI Banner */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: bmi ? bmiBg : 'var(--bg-surface2)', 
            padding: '12px 16px', 
            borderRadius: '12px', 
            marginTop: '12px',
            marginBottom: '16px',
            border: `1px solid ${bmi ? bmiColor + '20' : 'var(--border)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Scale size={16} color={bmi ? bmiColor : 'var(--text-muted)'} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {bmi ? `BMI: ${bmi.toFixed(1)}` : 'BMI Calculator'}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {bmi ? 'Calculated automatically from your height & weight.' : 'Enter height & weight below to calculate BMI.'}
                </p>
              </div>
            </div>
            {bmi && (
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                padding: '3px 8px', 
                borderRadius: '12px', 
                color: bmiColor, 
                background: '#ffffff',
                border: `1px solid ${bmiColor}30`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                {bmiClass}
              </span>
            )}
          </div>

          {/* EDIT MODE */}
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    placeholder="180"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="75"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="25"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Sex</label>
                  <select 
                    value={sex} 
                    onChange={e => setSex(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Primary Goal</label>
                  <select 
                    value={primaryGoal} 
                    onChange={e => setPrimaryGoal(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="fat_loss">Fat Loss</option>
                    <option value="strength">Strength & Power</option>
                    <option value="recomposition">Recomposition</option>
                    <option value="posture">Posture & Mobility</option>
                    <option value="endurance">Endurance</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Fitness Level</label>
                  <select 
                    value={fitnessLevel} 
                    onChange={e => setFitnessLevel(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Days Train / Week</label>
                  <input
                    type="number"
                    value={trainingDays}
                    onChange={e => setTrainingDays(e.target.value)}
                    placeholder="4"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    placeholder="2"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Available Equipment (Comma separated)</label>
                <input
                  type="text"
                  value={equipmentInput}
                  onChange={e => setEquipmentInput(e.target.value)}
                  placeholder="dumbbells, barbell, pull up bar, cables"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Injuries / Limitations</label>
                <textarea
                  value={injuries}
                  onChange={e => setInjuries(e.target.value)}
                  placeholder="None, lower back soreness, right knee issue"
                  rows={2}
                  style={textareaStyle}
                />
              </div>

              {error && (
                <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>{error}</p>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                    background: 'var(--em-500)', color: '#fff', fontSize: '13px', fontWeight: 700,
                    cursor: 'pointer', transition: 'background 0.15s'
                  }}
                >
                  {isPending ? 'Saving…' : 'Save Details'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  style={{
                    padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border)',
                    background: 'none', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', transition: 'background 0.15s'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* DISPLAY MODE (Static View) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <StaticCell label="Height" value={initialProfile?.height_cm ? `${initialProfile.height_cm} cm` : '—'} />
                <StaticCell label="Weight" value={initialProfile?.weight_kg ? `${initialProfile.weight_kg} kg` : '—'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <StaticCell label="Age" value={initialProfile?.age ? `${initialProfile.age} yrs` : '—'} />
                <StaticCell label="Sex" value={initialProfile?.sex ? (initialProfile.sex === 'prefer_not_to_say' ? 'Prefer not to say' : initialProfile.sex.charAt(0).toUpperCase() + initialProfile.sex.slice(1)) : '—'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <StaticCell label="Primary Goal" value={initialProfile?.primary_goal ? goalLabels[initialProfile.primary_goal] || initialProfile.primary_goal : '—'} />
                <StaticCell label="Fitness Level" value={initialProfile?.fitness_level ? fitnessLevelLabels[initialProfile.fitness_level] || initialProfile.fitness_level : '—'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <StaticCell label="Weekly Commitment" value={initialProfile?.training_days_per_week ? `${initialProfile.training_days_per_week} days/week` : '—'} />
                <StaticCell label="Experience" value={initialProfile?.experience_years ? `${initialProfile.experience_years} years` : '—'} />
              </div>

              <div>
                <StaticCell 
                  label="Available Equipment" 
                  value={initialProfile?.available_equipment && initialProfile.available_equipment.length > 0 
                    ? initialProfile.available_equipment.map(e => e.charAt(0).toUpperCase() + e.slice(1)).join(', ') 
                    : '—'} 
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <ShieldAlert size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Injuries & Limitations</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-surface2)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  {initialProfile?.injuries_limitations || 'No documented injuries or movement restrictions.'}
                </p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function StaticCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '3px' }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box'
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  height: '38px'
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  resize: 'none'
}
