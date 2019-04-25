import React from 'react'
import { Redirect, Route, RouteComponentProps, Switch } from 'react-router'

import ColorsEditor from './ColorsEditor'
import EditorSelector from './EditorSelector'
import FontFamilyList from './typography/FontFamilyList'
import TypographyEditor from './typography/TypographyEditor'

import { GenerateStyleSheetData } from './queries/GenerateStyleSheet'
import CustomFont from './typography/CustomFont'

export const ColorsIdParam = ':id'

export enum EditorPath {
  selector = '/',
  colors = '/colors/:id',
  typography = '/typography',
  fontFamily = '/font-family',
  customFont = '/custom-font',
  customFontFile = '/custom-font/file',
  customFontLink = '/custom-font/link',
}

interface Props {
  data: GenerateStyleSheetData | null
  hooks: {
    config: [TachyonsConfig, React.Dispatch<Partial<TachyonsConfig>>]
    editing: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
    name: [string, React.Dispatch<React.SetStateAction<string>>]
  }
  onSave: () => void
  setStyleAsset: (asset: StyleAssetInfo) => void
  stopEditing: () => void
}

const StyleEditorRouter: React.FunctionComponent<Props> = ({
  data,
  hooks: {
    config: [config, updateStyle],
    name: [name],
  },
  onSave,
  setStyleAsset,
  stopEditing,
}) => {
  const stylesheet = data && data.generateStyleSheet
  if (stylesheet) {
    setStyleAsset({ type: 'stylesheet', value: stylesheet })
  }

  const renderEditorSelector = (_: RouteComponentProps) => (
    <EditorSelector {...{ config, name, onSave, stopEditing }} />
  )

  const colorsPaths = [
    EditorPath.colors,
    EditorPath.colors.replace(ColorsIdParam, ''),
  ]
  const renderColorsEditor = (props: RouteComponentProps<ColorRouteParams>) => (
    <ColorsEditor {...{ ...props, updateStyle, config, onSave }} />
  )

  return (
    <div className="h-100 flex flex-column flex-grow-1 overflow-y-auto overflow-x-hidden">
      <Switch>
        <Route exact path={EditorPath.selector} render={renderEditorSelector} />
        <Route exact path={colorsPaths} render={renderColorsEditor} />
        <Route
          exact
          path={EditorPath.typography}
          component={TypographyEditor}
        />
        <Route exact path={EditorPath.fontFamily} component={FontFamilyList} />

        <Redirect
          exact
          from={EditorPath.customFont}
          to={EditorPath.customFontFile}
        />
        <Route path={EditorPath.customFont} component={CustomFont} />
      </Switch>
    </div>
  )
}

export default StyleEditorRouter
