'use client'

import { useState, useEffect } from 'react'
import apiService from '@/lib/apiService'
import { Card, CardContent, Input, Button, Alert } from '@/components/ui'

interface HomepageSettingsForm {
  hotNowPostId: string
  editorsChoicePostIds: string
  worthReadingPostIds: string
  featuredCategorySlug: string
  ytPlaylist101: string
  ytPlaylistNewsReview: string
  ytPlaylistHotVideos: string
}

const DEFAULT_FORM: HomepageSettingsForm = {
  hotNowPostId: '',
  editorsChoicePostIds: '',
  worthReadingPostIds: '',
  featuredCategorySlug: 'funding',
  ytPlaylist101: '',
  ytPlaylistNewsReview: '',
  ytPlaylistHotVideos: '',
}

const HomepageSettingsPanel = () => {
  const [form, setForm] = useState<HomepageSettingsForm>(DEFAULT_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiService.getHomepageSettings() as HomepageSettingsForm & {
          editorsChoicePostIds?: string[]
          worthReadingPostIds?: string[]
        }
        setForm({
          hotNowPostId: data.hotNowPostId || '',
          editorsChoicePostIds: (data.editorsChoicePostIds || []).join(', '),
          worthReadingPostIds: (data.worthReadingPostIds || []).join(', '),
          featuredCategorySlug: data.featuredCategorySlug || 'funding',
          ytPlaylist101: data.ytPlaylist101 || '',
          ytPlaylistNewsReview: data.ytPlaylistNewsReview || '',
          ytPlaylistHotVideos: data.ytPlaylistHotVideos || '',
        })
      } catch (error) {
        console.error('Failed to load homepage settings:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await apiService.updateHomepageSettings({
        hotNowPostId: form.hotNowPostId || null,
        editorsChoicePostIds: form.editorsChoicePostIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        worthReadingPostIds: form.worthReadingPostIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        featuredCategorySlug: form.featuredCategorySlug,
        ytPlaylist101: form.ytPlaylist101,
        ytPlaylistNewsReview: form.ytPlaylistNewsReview,
        ytPlaylistHotVideos: form.ytPlaylistHotVideos,
      })
      setMessage('Homepage settings saved successfully!')
    } catch {
      setMessage('Failed to save homepage settings')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof HomepageSettingsForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) return null

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Homepage Curation</h3>
            <p className="text-sm text-gray-500 mt-1">
              Pin posts and configure YouTube playlists for the magazine homepage
            </p>
          </div>
          <Button onClick={handleSave} loading={saving} variant="primary" size="sm">
            Save Homepage
          </Button>
        </div>

        {message && (
          <Alert variant={message.includes('success') ? 'success' : 'danger'} className="mb-4">
            {message}
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Hot Now Post ID"
            value={form.hotNowPostId}
            onChange={(e) => handleChange('hotNowPostId', e.target.value)}
            helperText="Firestore post ID to feature as hero"
          />
          <Input
            label="Featured Category Slug"
            value={form.featuredCategorySlug}
            onChange={(e) => handleChange('featuredCategorySlug', e.target.value)}
            helperText="e.g. funding, startup, tech-news"
          />
          <Input
            label="Editor's Choice Post IDs"
            value={form.editorsChoicePostIds}
            onChange={(e) => handleChange('editorsChoicePostIds', e.target.value)}
            helperText="Comma-separated post IDs"
            className="sm:col-span-2"
          />
          <Input
            label="Worth Reading Post IDs"
            value={form.worthReadingPostIds}
            onChange={(e) => handleChange('worthReadingPostIds', e.target.value)}
            helperText="Comma-separated post IDs"
            className="sm:col-span-2"
          />
          <Input
            label="YouTube Playlist — TechBlit 101"
            value={form.ytPlaylist101}
            onChange={(e) => handleChange('ytPlaylist101', e.target.value)}
            helperText="Playlist ID (PLxxx...)"
          />
          <Input
            label="YouTube Playlist — Weekly Review"
            value={form.ytPlaylistNewsReview}
            onChange={(e) => handleChange('ytPlaylistNewsReview', e.target.value)}
            helperText="Playlist ID (PLxxx...)"
          />
          <Input
            label="YouTube Playlist — Hot Videos"
            value={form.ytPlaylistHotVideos}
            onChange={(e) => handleChange('ytPlaylistHotVideos', e.target.value)}
            helperText="Playlist ID (PLxxx...)"
            className="sm:col-span-2"
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default HomepageSettingsPanel
