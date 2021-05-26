import React, { useReducer, useEffect, useState } from 'react'
import fbt from 'fbt'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'

import CKEditor from 'ckeditor4-react'

import useConfig from 'utils/useConfig'
import useBackendApi from 'utils/useBackendApi'
import { formInput, formFeedback } from 'utils/formHelpers'
import { useStateValue } from 'data/state'

import Link from 'components/Link'
import AdminConfirmationModal from 'components/ConfirmationModal'

function reducer(state, newState) {
  return { ...state, ...newState }
}

const configFields = [
  'about'
]
const placeholder = "Sample text"

const ABOUT_FILENAME = 'about.html'

const LegalSettings = () => {
  const { config } = useConfig()
  const [{ admin }, dispatch] = useStateValue()
  const { postRaw, post } = useBackendApi({ authToken: true })
  const [state, setState] = useReducer(reducer, { domain: '' })
  const input = formInput(state, (newState) =>
    setState({ ...newState, hasChanges: true })
  )
  const Feedback = formFeedback(state)
  const [saving, setSaving] = useState(false)
  const [aboutText, setAboutText] = useState('')

  useEffect(() => {
    setState({
      ...pick(config, configFields)
    })
  }, [config])

  useEffect(() => {
    let timeout
    if (config.about) {
      fetch(`${config.dataSrc}${config.about}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch')
          return res.text()
        })
        // NOTE: CKEditor takes a few seconds to load
        .then((body) => (timeout = setTimeout(() => setAboutText(body), 2000)))
        .catch((err) => {
          console.error('Failed to load about page', err)
        })
    }

    return () => clearTimeout(timeout)
  }, [config && config.about])

  const actions = (
    <div className="actions">
      <AdminConfirmationModal
        customEl={
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={saving || !state.hasChanges}
          >
            <fbt desc="Cancel">Cancel</fbt>
          </button>
        }
        confirmText={fbt(
          'Unsaved changes will be lost. Continue?',
          'areYouSure'
        )}
        onConfirm={() => {
          window.location.reload()
          return
        }}
      />
      <button
        type="submit"
        className={`btn btn-${state.hasChanges ? '' : 'outline-'}primary`}
        disabled={saving || !state.hasChanges}
        children={
          saving ? (
            <fbt desc="Updating">Updating</fbt>
          ) : (
            <fbt desc="Update">Update</fbt>
          )
        }
      />
    </div>
  )

  // Seperating out a component for CKEditor that has 'default' options set on the toolbar. To customize CKEditor's toolbar, see https://ckeditor.com/docs/ckeditor4/latest/features/toolbar.html
  const Editor = ({data, onChange}) => {
    return <CKEditor data={data} config={{
            toolbar: [
              {
                name: 'clipboard',
                items: [
                  'Cut',
                  'Copy',
                  'Paste',
                  'PasteText',
                  '-',
                  'Undo',
                  'Redo'
                ]
              },
              { name: 'editing', items: ['Find', 'Replace', 'Scayt'] },
              { name: 'forms', items: ['Button', 'ImageButton'] },
              '/',
              {
                name: 'basicstyles',
                items: [
                  'Bold',
                  'Italic',
                  'Underline',
                  'Strike',
                  'Subscript',
                  'Superscript',
                  '-',
                  'CopyFormatting',
                  'RemoveFormat'
                ]
              },
              {
                name: 'paragraph',
                items: [
                  'NumberedList',
                  'BulletedList',
                  '-',
                  'Outdent',
                  'Indent',
                  '-',
                  'Blockquote',
                  'CreateDiv',
                  '-',
                  'JustifyLeft',
                  'JustifyCenter',
                  'JustifyRight',
                  'JustifyBlock',
                  '-',
                  'Language'
                ]
              },
              { name: 'links', items: ['Link', 'Unlink'] },
              {
                name: 'insert',
                items: [
                  'Image',
                  'Table',
                  'HorizontalRule',
                  'Smiley',
                  'SpecialChar'
                ]
              },
              '/',
              {
                name: 'styles',
                items: ['Styles', 'Format', 'Font', 'FontSize']
              },
              { name: 'colors', items: ['TextColor', 'BGColor'] },
              { name: 'tools', items: ['Maximize'] }
            ]
          }}
          onChange={onChange} />
  }

  return (
    <form
      autoComplete="off"
      onSubmit={async (e) => {
        e.preventDefault()

        if (saving) return

        setSaving(true)

        try {
          const shopPolicies = pickBy(state, (v, k) => !k.endsWith('Error'))

          // Shop policy pages object
          shopPolicies.pages = policies

          // const shopPoliciesRes = //tbd await post('tbd', {
          //   method: 'PUT',
          //   body: JSON.stringify(shopPolicies),
          //   suppressError: true
          // })

          if (!shopPolicies.success && shopPolicies.field) {
            setState({ [`${shopPolicies.field}Error`]: shopConfigRes.reason })
            setSaving(false)
            return
          }

          setState({ hasChanges: false })
          setSaving(false)
          dispatch({
            type: 'toast',
            message: (
              <fbt desc="admin.settings.appearance.savedMessage">
                Settings saved
              </fbt>
            )
          })
        } catch (err) {
          console.error(err)
          setSaving(false)
        }
      }}
    >
      <h3 className="admin-title with-border">
        <Link to="/admin/settings" className="muted">
          <fbt desc="Settings">Settings</fbt>
        </Link>
        <span className="chevron" />
        <fbt desc="Legal">Legal</fbt>
        {actions}
      </h3>
      <div className="form-group">
        <label>
          <fbt desc="admin.settings.legal">
            Add policy-related pages to your store e.g., Terms and Conditions, Privacy Policy, Conditions of Sale, etc.
          </fbt>
          <span>
            (
            <fbt desc="admin.settings.appearance.aboutStoreDesc">
              visible on the footer of your website
            </fbt>
            )
          </span>
        </label>
        <label>
          <fbt desc="admin.settings.legal.title0">
            Title
          </fbt>
          <input {...input(placeholder)} />
        </label>
        <Editor
          data={aboutText}
          onChange={(e) => setAboutText(e.editor.getData())}
        />
      </div>
      <div className="footer-actions">{actions}</div>
    </form>
  )
}

export default LegalSettings
