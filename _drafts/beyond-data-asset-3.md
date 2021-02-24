---
layout: post
status: publish
published: true
comments: true
has-code: true
has-lightbox: true
title: Beyond DataAsset - Custom Editor (Part 3)
date: '2020-12-15 00:00:00 -0700'
tags: [unreal, data-asset, c++]
preview-img:
    url: /img/blog/2015/10/20151023_113508.jpg
    alt: VR for G3
---

A custom AssetEditor can make all the difference in how your systems are
structured. Knowing that complex asset types can have a reasonable editing
experience removes one factor that can affect runtime performance or system
extensibility.

In part 2, we looked at importing and exporting assets from external files,
allowing asset data to be edited outside the engine. In this part, we will
be building our own in-engine editor for complex data in an asset.

# AssetEditor Classes

Before framing out all of the classes, it is important to understand what the
base classes do and how they all relate to each other.

  - `FAssetEditorToolkit` is the top-level class for the asset editor. It
  represents the contents of the window, allowing customization of the main
  menu and the addition of any number of widgets in dockable tabs.
  - `IDetailsView` is the standard property editor
  - `SAssetEditorViewport` is a viewport widget subclass with some defaults
  for an asset editor.
  - `FEditorViewportClient` is a class that provides controls for interacting
  with a viewport, it is owned by the viewport.
  - `SDockTab` is a dockable tab widget. All views in the editor are contained
  in one.
  - `FTabManager` is a container for tabs, they are registered with a name,
  metadata, and delegate to spawn an `SDockTab`.
  - `FTabManager::FLayout` contains the layout of all of the open tabs. A
  default layout is specified by the editor, but all layouts in the editor are
  saved when the user modifies the layout by moving, opening, or closing tabs.
  - `FUICommandInfo` represents an abstract action in the editor UI. It
  contains a name, a type (like button or checkbox), and an optional keyboard
  shortcut.
  - `FUICommandList` binds UICommandInfos to delegates that run on the host.
  The host can be any Slate widget, including viewports and the AssetEditor
  itself.
  - `FMenuBuilder` is how toolbars and context menus are built. Bound
  UICommandInfos can be added to a menu, but it is also possible to provide all
  the details directly to the MenuBuilder.
  - `FExtender` allows adding menu entries to a menu that has already been
  built. This is commonly used for extending the main toolbar with the
  Save/Browse buttons, and is useful for allowing project code or plugins to
  extend the engine's editors.
  
# Blank Editor

To start, we will make a stubbed out `FAssetEditorToolkit` subclass that is the
bare minimum to open an AssetEditor window that we have control over.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.h" %}
{% highlight cpp linenos %}
#pragma once

#include "Toolkits/AssetEditorToolkit.h"

class UTargetPracticeRound;

class FTargetPracticeRoundEditor : public FAssetEditorToolkit
{
public:

    void InitTargetPracticeRoundEditor(const EToolkitMode::Type Mode, const TSharedPtr<class IToolkitHost>& InitToolkitHost, UTargetPracticeRound* ObjectToEdit);

    virtual FName GetToolkitFName() const override;
    virtual FText GetBaseToolkitName() const override;
    virtual FString GetWorldCentricTabPrefix() const override;
    virtual FLinearColor GetWorldCentricTabColorScale() const override;
};
{% endhighlight %}

The overridden functions are only pure virtual functions that we are required to
override in order to compile.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.cpp" %}
{% highlight cpp linenos %}
#include "TargetPracticeRoundEditor.h"

#include "TargetPracticeRound.h"

#define LOCTEXT_NAMESPACE "TargetPracticeRoundEditor"

const FName TargetPracticeRoundAppIdentifier = FName(TEXT("TargetPracticeRoundEditorApp"));

void FTargetPracticeRoundEditor::InitTargetPracticeRoundEditor(const EToolkitMode::Type Mode, const TSharedPtr<class IToolkitHost>& InitToolkitHost, UTargetPracticeRound* ObjectToEdit)
{
    const TSharedRef<FTabManager::FLayout> StandaloneDefaultLayout = FTabManager::NewLayout("Standalone_TargetPracticeRoundEditor_Layout_v0.1")
        ->AddArea
        (
            FTabManager::NewPrimaryArea()
        );

    const bool bCreateDefaultStandaloneMenu = true;
    const bool bCreateDefaultToolbar = true;
    FAssetEditorToolkit::InitAssetEditor(Mode, InitToolkitHost, TargetPracticeRoundAppIdentifier, StandaloneDefaultLayout, bCreateDefaultToolbar, bCreateDefaultStandaloneMenu, ObjectToEdit);
}

FName FTargetPracticeRoundEditor::GetToolkitFName() const
{
    return FName("TargetPracticeRoundEditor");
}

FText FTargetPracticeRoundEditor::GetBaseToolkitName() const
{
    return LOCTEXT("AppLabel", "TargetPracticeRound Editor");
}

FString FTargetPracticeRoundEditor::GetWorldCentricTabPrefix() const
{
    return LOCTEXT("WorldCentricTabPrefix", "TargetPracticeRound ").ToString();
}

FLinearColor FTargetPracticeRoundEditor::GetWorldCentricTabColorScale() const
{
    return FLinearColor();
}

#undef LOCTEXT_NAMESPACE
{% endhighlight %}

This tutorial does not cover use of the "World Centric" editor, so the values
provided to the overridden functions are unused defaults.

The layout needs at least one area in order to be valid. The layout name follows
the same pattern as other AssetEditors in the engine. The version number at the
end is used to invalidate any saved layouts from users of this editor.

We now need to run `InitTargetPracticeRoundEditor` from our AssetTypeActions
subclass.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetTypeActions/AssetTypeActions_TargetPracticeRound.h" %}
{% highlight cpp linenos %}
// ...
class FAssetTypeActions_TargetPracticeRound : public FAssetTypeActions_Base
{
    // ...
    virtual void OpenAssetEditor(const TArray<UObject*>& InObjects, TSharedPtr<IToolkitHost> EditWithinLevelEditor = TSharedPtr<IToolkitHost>()) override;
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetTypeActions/AssetTypeActions_TargetPracticeRound.h" %}
{% highlight cpp linenos %}
void FAssetTypeActions_TargetPracticeRound::OpenAssetEditor(const TArray<UObject*>& InObjects, TSharedPtr<IToolkitHost> EditWithinLevelEditor)
{
    const EToolkitMode::Type Mode = EditWithinLevelEditor.IsValid() ? EToolkitMode::WorldCentric : EToolkitMode::Standalone;

    for (auto ObjIt = InObjects.CreateConstIterator(); ObjIt; ++ObjIt)
    {
        if (UTargetPracticeRound* TargetPracticeRound = Cast<UTargetPracticeRound>(*ObjIt))
        {
            TSharedRef<FTargetPracticeRoundEditor> NewTargetPracticeRoundEditor(new FTargetPracticeRoundEditor());
            NewTargetPracticeRoundEditor->InitTargetPracticeRoundEditor(Mode, EditWithinLevelEditor, TargetPracticeRound);
        }
    }
}
{% endhighlight %}

Finally, we need to add our new module dependencies to our `.Build.cs` file
again.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/BeyondDataAssetEditor.Build.cs" %}
{% highlight csharp linenos %}
// ...
PublicDependencyModuleNames.AddRange(new string[]
{
    // ...
    "SlateCore",
    "Slate",
    "UnrealEd"
});
// ...
{% endhighlight %}

The result of this code is an entirely empty AssetEditor when an asset is double
clicked.

[![][img1]][img1]{: data-lightbox="img1"}

Most tutorials will skip this step and provide code for an AssetEditor with a
details panel or another simple panel, but I believe starting with a blank slate
is a great opportunity to provide a deeper understanding of the structure of an
AssetEditor by showing the editor in intermediate steps.

# Adding the Toolbar

You might be surprised to see that the blank editor does not have a toolbar,
since it's included in every engine AssetEditor. The toolbar widget is provided
by the base class but it is up to the individual editor to include it in the
layout.

With the blank editor, you can still open the toolbar with `Window > Toolbar`.
It will open in a new window because it is not included in the layout anywhere,
but you can drag the tab from that window into the main area of the AssetEditor
and the entire window will be a toolbar.

## Layout Syntax

Layouts are built in a single expression just like
[widget composition in Slate][1]. Because the toolbar is provided by the base
class, we can add it into the layout without any of the overhead of creating
new tabs.

We're going to bump up the version number of the layout and split the space
vertically.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.cpp" %}
{% highlight cpp linenos %}
// ...
void FTargetPracticeRoundEditor::InitTargetPracticeRoundEditor(const EToolkitMode::Type Mode, const TSharedPtr<class IToolkitHost>& InitToolkitHost, UTargetPracticeRound* ObjectToEdit)
{
    const TSharedRef<FTabManager::FLayout> StandaloneDefaultLayout = FTabManager::NewLayout("Standalone_TargetPracticeRoundEditor_Layout_v0.2")
        ->AddArea
        (
            FTabManager::NewPrimaryArea()
            ->SetOrientation(Orient_Vertical)
            ->Split
            (
                FTabManager::NewStack()
                ->SetSizeCoefficient(0.1f)
                ->SetHideTabWell(true)
                ->AddTab(GetToolbarTabId(), ETabState::OpenedTab)
            )
            ->Split
            (
                FTabManager::NewStack()
                ->SetSizeCoefficient(0.9f)
            )
        );
    // ...
}
// ...
{% endhighlight %}

This small addition contains some information about how this layout system
works.

First and foremost, `Split` is a function that has to be called twice to
separate the primary area in two. This shows that each area can be split as many
times as desired, not just into left/right or up/down. We will later see that
this splitting can also be tiled.

We can also see that tabs are added into "stacks". This is what allows multiple
tabs to be opened on top of each other with the tabwell on top to switch between
them. The toolbar is configured to hide the tabwell.

Finally, note that the layout does not deal with any widgets or delegates
directly. `GetToolbarTabId()` returns a `FName`. Because the layout gets saved
to disk, everything it contains must be serializable. Tab spawners are
registered with the AssetEditor separately and bound to the same ID provided to
the layout.

With this one change, we now have the standard toolbar in our otherwise still
blank window.

[![][img2]][img2]{: data-lightbox="img2"}

# Adding a Details View

The next step is to add a details view, which will make our custom AssetEditor
look almost identical to the regular DataAsset editor. Unlike the toolbar, we
have to create the details view and tab ourselves.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.h" %}
{% highlight cpp linenos %}
// ...
class FTargetPracticeRoundEditor : public FAssetEditorToolkit
{
public:
    // ...
    virtual void RegisterTabSpawners(const TSharedRef<class FTabManager>& InTabManager) override;
    virtual void UnregisterTabSpawners(const TSharedRef<class FTabManager>& InTabManager) override;
    // ...
private:
    TSharedRef<SDockTab> SpawnTab_Properties(const FSpawnTabArgs& Args);

    static const FName PropertiesTabId;

    UTargetPracticeRound* EditingTargetPracticeRound;
    TSharedPtr< SDockableTab > PropertiesTab;
    TSharedPtr< class IDetailsView > DetailsView;
};
{% endhighlight %}

First, we must initialize `DetailsView` during initialization and add space for
`PropertiesTabId` in our layout.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.cpp" %}
{% highlight cpp linenos %}
// ...
#include "EditorStyleSet.h"
#include "IDetailsView.h"
#include "Modules/ModuleManager.h"
#include "PropertyEditorModule.h"
#include "Widgets/Docking/SDockTab.h"
// ...
const FName FTargetPracticeRoundEditor::PropertiesTabId(TEXT("TargetPracticeRoundEditor_Properties"));
// ...
void FTargetPracticeRoundEditor::InitTargetPracticeRoundEditor(const EToolkitMode::Type Mode, const TSharedPtr<class IToolkitHost>& InitToolkitHost, UTargetPracticeRound* ObjectToEdit)
{
    EditingTargetPracticeRound = ObjectToEdit;

    const bool bIsUpdatable = false;
    const bool bIsLockable = false;
    FPropertyEditorModule& PropertyEditorModule = FModuleManager::GetModuleChecked<FPropertyEditorModule>("PropertyEditor");
    const FDetailsViewArgs DetailsViewArgs(bIsUpdatable, bIsLockable, true, FDetailsViewArgs::ObjectsUseNameArea, false);
    DetailsView = PropertyEditorModule.CreateDetailView(DetailsViewArgs);
    DetailsView->SetObject(EditingTargetPracticeRound);

    const TSharedRef<FTabManager::FLayout> StandaloneDefaultLayout = FTabManager::NewLayout("Standalone_TargetPracticeRoundEditor_Layout_v0.3")
        ->AddArea
        (
            FTabManager::NewPrimaryArea()
            ->SetOrientation(Orient_Vertical)
            ->Split
            (
                // ...
            )
            ->Split
            (
                FTabManager::NewSplitter()
                ->SetSizeCoefficient(0.9f)
                ->Split
                (
                    FTabManager::NewStack()
                    ->AddTab(PropertiesTabId, ETabState::OpenedTab)
                )
            )
        );
}
// ...
{% endhighlight %}

Next, we need to register a new tab spawner for the tab we just added to our
layout.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.cpp" %}
{% highlight cpp linenos %}
void FTargetPracticeRoundEditor::RegisterTabSpawners(const TSharedRef<class FTabManager>& InTabManager)
{
    WorkspaceMenuCategory = InTabManager->AddLocalWorkspaceMenuCategory(LOCTEXT("WorkspaceMenu_AssetEditor", "Asset Editor"));
    auto WorkspaceMenuCategoryRef = WorkspaceMenuCategory.ToSharedRef();

    FAssetEditorToolkit::RegisterTabSpawners(InTabManager);

    InTabManager->RegisterTabSpawner(PropertiesTabId, FOnSpawnTab::CreateSP(this, &FTargetPracticeRoundEditor::SpawnTab_Properties))
        .SetDisplayName(LOCTEXT("PropertiesTab", "Details"))
        .SetGroup(WorkspaceMenuCategoryRef)
        .SetIcon(FSlateIcon(FEditorStyle::GetStyleSetName(), "LevelEditor.Tabs.Details"));
}

void FTargetPracticeRoundEditor::UnregisterTabSpawners(const TSharedRef<class FTabManager>& InTabManager)
{
    FAssetEditorToolkit::UnregisterTabSpawners(InTabManager);

    InTabManager->UnregisterTabSpawner(PropertiesTabId);
}
{% endhighlight %}

And now we need an implementation for `SpawnTab_Properties` to actually spawn
the tab containing the `DetailsView` we initialized earlier.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.cpp" %}
{% highlight cpp linenos %}
TSharedRef<SDockTab> FTargetPracticeRoundEditor::SpawnTab_Properties(const FSpawnTabArgs& Args)
{
    check(Args.GetTabId() == PropertiesTabId);

    return SNew(SDockTab)
        .Icon(FEditorStyle::GetBrush("GenericEditor.Tabs.Properties"))
        .Label(LOCTEXT("GenericDetailsTitle", "Details"))
        .TabColorScale(GetTabColorScale())
        [
            DetailsView.ToSharedRef()
        ];
}
{% endhighlight %}

## Garbage Collection

With this addition, we are now storing a `UObject*` that is not a `UPROPERTY`.
This means this pointer is not tracked by the GC. We need to manually provide
a reference to this pointer using `FGCObject`.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.h" %}
{% highlight cpp linenos %}
// ...
#include "UObject/GCObject.h"
// ...
class FTargetPracticeRoundEditor : public FAssetEditorToolkit, public FGCObject
{
public:
    // ...
    virtual void AddReferencedObjects(FReferenceCollector& Collector) override;
    // ...
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.cpp" %}
{% highlight cpp linenos %}
void FTargetPracticeRoundEditor::AddReferencedObjects(FReferenceCollector& Collector)
{
    Collector.AddReferencedObject(EditingTargetPracticeRound);
}
{% endhighlight %}

And again, we have a few more module dependencies.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/BeyondDataAssetEditor.Build.cs" %}
{% highlight csharp linenos %}
// ...
PublicDependencyModuleNames.AddRange(new string[]
{
    // ...
    "EditorStyle",
    "PropertyEditor"
});
// ...
{% endhighlight %}

The editor will now look very similar to the DataAsset editor. For reference,
DataAsset uses `FSimpleAssetEditor`.

[![][img3]][img3]{: data-lightbox="img3"}

# Adding a Viewport

Because our asset has 3d data, it makes a lot of sense to add a 3d viewport and
draw a representation of the data. This is more involved than the toolbar or
details view as we need to set up a few subclasses. This code is largely based
off the StaticMesh editor included with the engine, primarily the 
`SStaticMeshEditorViewport` and `FStaticMeshEditorViewportClient` classes.

## Viewport Rendering

The viewport is responsible for storing and rendering all of our 3d data. If you
are not already familiar with how Unreal rendering works at the highest level,
it works like this for the main game world. `UWorld::Scene` contains everything
necessary to render the game, and only interacts with components inheriting from
`UPrimitiveComponent`. All valid components will eventually be registered
through `UActorComponent::ExecuteRegisterEvents`. Part of registration is
calling `CreateRenderState_Concurrent`.

For PrimitiveComponents, this means running
`GetWorld()->Scene->AddPrimitive(this);`. `FScene` handles it from there. The
primitive is removed from the scene during unregistration, and a number of
actions can update the primitive in the scene.

For Editor Viewports, we need a separate world and scene, which is handled by
`FPreviewScene`. Despite the name, this class does not inherit from `FScene` but
instead handles correct creation of a new `UWorld`, handles component
registration directly, and optionally provides a default lighting environment.

`FAdvancedPreviewScene` is a subclass that goes a step further and provides a
skybox, grid, floor, etc. This is the basic scene you are used to seeing across
the engine, including the Static Mesh and Matrial editors.

## Editor Viewport

With this knowledge, we will now make a subclass of `SAssetEditorViewport`
containing a scene and some components.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.h" %}
{% highlight cpp linenos %}
#pragma once

#include "AdvancedPreviewScene.h"
#include "EditorViewportClient.h"
#include "SAssetEditorViewport.h"
#include "SlateFwd.h"
#include "UObject/GCObject.h"

class FTargetPracticeRoundEditor;
class UTargetPracticeRound;

class STargetPracticeRoundEditorViewport : public SAssetEditorViewport, public FGCObject
{
public:
	SLATE_BEGIN_ARGS(STargetPracticeRoundEditorViewport) {}
		SLATE_ARGUMENT(TWeakPtr<FTargetPracticeRoundEditor>, TargetPracticeRoundEditor)
	SLATE_END_ARGS()

	void Construct(const FArguments& InArgs);
	STargetPracticeRoundEditorViewport();
	~STargetPracticeRoundEditorViewport();

	virtual void AddReferencedObjects(FReferenceCollector& Collector) override;

protected:
	virtual TSharedRef<FEditorViewportClient> MakeEditorViewportClient() override;

private:
	TWeakPtr<SDockTab> ParentTab;
	TWeakPtr<FTargetPracticeRoundEditor> TargetPracticeRoundEditorPtr;
	TSharedPtr<FAdvancedPreviewScene> PreviewScene;
	TSharedPtr<class FTargetPracticeRoundEditorViewportClient> EditorViewportClient;

	UTargetPracticeRound* TargetPracticeRound;
};
{% endhighlight %}

Note that we are once again using `FGCObject` to manually track pointers to
`UObject`s.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.cpp" %}
{% highlight cpp linenos %}
#include "STargetPracticeRoundEditorViewport.h"

#include "TargetPracticeRoundEditor.h"
#include "TargetPracticeRoundEditorViewportClient.h"

void STargetPracticeRoundEditorViewport::Construct(const FArguments& InArgs)
{
	TargetPracticeRoundEditorPtr = InArgs._TargetPracticeRoundEditor;

	TSharedPtr<FTargetPracticeRoundEditor> PinnedEditor = TargetPracticeRoundEditorPtr.Pin();
	TargetPracticeRound = PinnedEditor.IsValid() ? PinnedEditor->GetTargetPracticeRound() : nullptr;

	SEditorViewport::Construct(SEditorViewport::FArguments());
}

STargetPracticeRoundEditorViewport::STargetPracticeRoundEditorViewport()
	: PreviewScene(MakeShareable(new FAdvancedPreviewScene(FPreviewScene::ConstructionValues())))
{
}

STargetPracticeRoundEditorViewport::~STargetPracticeRoundEditorViewport()
{
    if (EditorViewportClient.IsValid())
	{
		EditorViewportClient->Viewport = nullptr;
	}
}

void STargetPracticeRoundEditorViewport::AddReferencedObjects(FReferenceCollector& Collector)
{
	Collector.AddReferencedObject(TargetPracticeRound);
}

TSharedRef<FEditorViewportClient> STargetPracticeRoundEditorViewport::MakeEditorViewportClient()
{
	EditorViewportClient = MakeShareable(new FTargetPracticeRoundEditorViewportClient(TargetPracticeRoundEditorPtr, SharedThis(this), PreviewScene.ToSharedRef(), TargetPracticeRound));
	EditorViewportClient->SetRealtime(true);

	return EditorViewportClient.ToSharedRef();
}
{% endhighlight %}

## Viewport Client

The viewport client is where all of the interactions of a viewport are
processed. For now our viewport client is going to be mostly empty, we will
explore interactions in the next part of this tutorial.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditorViewportClient.h" %}
{% highlight cpp linenos %}
#pragma once

#include "EditorViewportClient.h"

class FAdvancedPreviewScene;
class FTargetPracticeRoundEditor;
class STargetPracticeRoundEditorViewport;
class UTargetPracticeRound;

class FTargetPracticeRoundEditorViewportClient : public FEditorViewportClient, public TSharedFromThis<FTargetPracticeRoundEditorViewportClient>
{
public:
	FTargetPracticeRoundEditorViewportClient(TWeakPtr<FTargetPracticeRoundEditor> InTargetPracticeRoundEditor, const TSharedRef<STargetPracticeRoundEditorViewport>& InTargetPracticeRoundEditorViewport, const TSharedRef<FAdvancedPreviewScene>& InPreviewScene, UTargetPracticeRound* InTargetPracticeRound);

private:

	TWeakPtr<FTargetPracticeRoundEditor> TargetPracticeRoundEditorPtr;
	TWeakPtr<STargetPracticeRoundEditorViewport> TargetPracticeRoundEditorViewportPtr;
	FAdvancedPreviewScene* AdvancedPreviewScene;
	UTargetPracticeRound* TargetPracticeRound;
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditorViewportClient.cpp" %}
{% highlight cpp linenos %}
#include "TargetPracticeRoundEditorViewportClient.h"

#include "AdvancedPreviewScene.h"
#include "STargetPracticeRoundEditorViewport.h"

FTargetPracticeRoundEditorViewportClient::FTargetPracticeRoundEditorViewportClient(TWeakPtr<FTargetPracticeRoundEditor> InTargetPracticeRoundEditor, const TSharedRef<STargetPracticeRoundEditorViewport>& InTargetPracticeRoundEditorViewport, const TSharedRef<FAdvancedPreviewScene>& InPreviewScene, UTargetPracticeRound* InTargetPracticeRound)
	: FEditorViewportClient(nullptr, &InPreviewScene.Get(), StaticCastSharedRef<SEditorViewport>(InTargetPracticeRoundEditorViewport))
	, TargetPracticeRoundEditorPtr(InTargetPracticeRoundEditor)
	, TargetPracticeRoundEditorViewportPtr(InTargetPracticeRoundEditorViewport)
{
	AdvancedPreviewScene = static_cast<FAdvancedPreviewScene*>(PreviewScene);
	TargetPracticeRound = InTargetPracticeRound;
}
{% endhighlight %}

## New Tab

This part is essentially the same as the details panel so it is shown with less
granularity. Viewports have a special class to bind to a dock, but this same
process can be followed for adding any Slate widget to a dockable tab in an
AssetEditor, by directly adding a new copy of your widget into the tab. 

First, add a new `SpawnTab` function, a tab ID name, and data needed for the
viewport.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.h" %}
{% highlight cpp linenos %}
class FTargetPracticeRoundEditor
{
    // ...
private:
    TSharedRef<SDockTab> SpawnTab_Viewport(const FSpawnTabArgs& Args);

    static const FName ViewportTabId;

    TSharedPtr<class FEditorViewportTabContent> ViewportTabContent;
	TFunction<TSharedRef<SEditorViewport>(void)> MakeViewportFunc;
}
{% endhighlight %}

Next, adjust the layout to include the viewport.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.cpp" %}
{% highlight cpp linenos %}
const FName FTargetPracticeRoundEditor::ViewportTabId(TEXT("TargetPracticeRoundEditor_Viewport"));
// ...
const TSharedRef<FTabManager::FLayout> StandaloneDefaultLayout = FTabManager::NewLayout("Standalone_TargetPracticeRoundEditor_Layout_v0.4")
    ->AddArea
    (
        FTabManager::NewPrimaryArea()
        ->SetOrientation(Orient_Vertical)
        ->Split
        (
            FTabManager::NewStack()
            ->SetSizeCoefficient(0.1f)
            ->SetHideTabWell(true)
            ->AddTab(GetToolbarTabId(), ETabState::OpenedTab)
        )
        ->Split
        (
            FTabManager::NewSplitter()
            ->SetOrientation(Orient_Horizontal)
            ->SetSizeCoefficient(0.9f)
            ->Split
            (
                FTabManager::NewStack()
                ->SetSizeCoefficient(0.6f)
                ->AddTab(ViewportTabId, ETabState::OpenedTab)
                ->SetHideTabWell(true)
            )
            ->Split
            (
                FTabManager::NewStack()
                ->SetSizeCoefficient(0.2f)
                ->AddTab(PropertiesTabId, ETabState::OpenedTab)
            )
        )
    );
{% endhighlight %}

Then handle tab registration.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.cpp" %}
{% highlight cpp linenos %}
void FTargetPracticeRoundEditor::RegisterTabSpawners(const TSharedRef<class FTabManager>& InTabManager)
{
    // ...
    InTabManager->RegisterTabSpawner(ViewportTabId, FOnSpawnTab::CreateSP(this, &FTargetPracticeRoundEditor::SpawnTab_Viewport))
		.SetDisplayName(LOCTEXT("ViewportTab", "Viewport"))
		.SetGroup(WorkspaceMenuCategoryRef)
		.SetIcon(FSlateIcon(FEditorStyle::GetStyleSetName(), "LevelEditor.Tabs.Viewports"));
}

void FTargetPracticeRoundEditor::UnregisterTabSpawners(const TSharedRef<class FTabManager>& InTabManager)
{
    // ...
    InTabManager->UnregisterTabSpawner(ViewportTabId);
}
{% endhighlight %}

Finally, implement the function to spawn the tab.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.cpp" %}
{% highlight cpp linenos %}
TSharedRef<SDockTab> FTargetPracticeRoundEditor::SpawnTab_Viewport(const FSpawnTabArgs& Args)
{
	TSharedRef< SDockTab > DockableTab =
		SNew(SDockTab)
		.Icon(FEditorStyle::GetBrush("LevelEditor.Tabs.Viewports"));

	TWeakPtr<FTargetPracticeRoundEditor> WeakSharedThis(SharedThis(this));
	MakeViewportFunc = [WeakSharedThis]()
	{
		return SNew(STargetPracticeRoundEditorViewport)
			.TargetPracticeRoundEditor(WeakSharedThis);
	};

	// Create a new tab
	ViewportTabContent = MakeShareable(new FEditorViewportTabContent());

	const FString LayoutId = FString("TargetPracticeRoundEditorViewport");
	ViewportTabContent->Initialize(MakeViewportFunc, DockableTab, LayoutId);

	return DockableTab;
}
{% endhighlight %}

Make sure to add our new module dependencies as well.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/BeyondDataAssetEditor.Build.cs" %}
{% highlight csharp linenos %}
// ...
PublicDependencyModuleNames.AddRange(new string[]
{
    // ...
    "AdvancedPreviewScene",
	"InputCore"
});
// ...
{% endhighlight %}

After compiling, the editor should now look like this, with a layout similar
to the StaticMesh editor.

[![][img4]][img4]{: data-lightbox="img4"}

# Viewport Content

Finally, we will use our new viewport to render our targets and update when
changes are made in the details panel.

## Adding Components

In general, all components rendered in the viewport are stored in the viewport
class and referenced elsewhere. In our case, we will be loading a StaticMesh
asset and rendering it on multiple components, one for each target. We will
also add a function to initialize the preview components.

The components are stored in nested arrays to organize them into the waves
they are previewing.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.h" %}
{% highlight cpp linenos %}
class STargetPracticeRoundEditorViewport : public SAssetEditorViewport, public FGCObject
{
public:
    // ...
    void SetPreviewRound(UTargetPracticeRound* TargetPracticeRound);
    // ...
private:
    // ...
    UStaticMesh* PreviewMesh;
	TArray<TArray<UStaticMeshComponent*>> PreviewComponents;
};
{% endhighlight %}

Before we implement `SetPreviewRound`, make sure that our mesh and components
are being tracked by the GC.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.cpp" %}
{% highlight cpp linenos %}
void STargetPracticeRoundEditorViewport::AddReferencedObjects(FReferenceCollector& Collector)
{
    // ...
    Collector.AddReferencedObject(PreviewMesh);

    for (auto& WaveComponents : PreviewComponents)
	{
		Collector.AddReferencedObjects(WaveComponents);
	}
}
{% endhighlight %}

Next, we load the mesh and create the components:

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.cpp" %}
{% highlight cpp linenos %}
STargetPracticeRoundEditorViewport::STargetPracticeRoundEditorViewport()
    // ...
{
    PreviewMesh = LoadObject<UStaticMesh>(nullptr, TEXT("/Game/TargetPractice/SM_Target.SM_Target"));
}
{% endhighlight %}

Note that for simplicity the asset path for this mesh is directly referenced
in code. This can be avoided by creating a new `UDeveloperSettings` subclass
and adding the mesh as a `UPROPERTY` which will push the asset path into an
ini file which can be updated without rebuilding code.

Next, we will implement `SetPreviewRound`. All preview components are
initialized at the same time, in the next part we will explore hiding
components to only view targets for a single wave. 

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.cpp" %}
{% highlight cpp linenos %}
#include "TargetPracticeRound.h"

// ...

void STargetPracticeRoundEditorViewport::SetPreviewRound(UTargetPracticeRound* TargetPracticeRound)
{
    for (auto& WaveComponents : PreviewComponents)
	{
		for (auto& Component : WaveComponents)
		{
			PreviewScene->RemoveComponent(Component);
		}
	}

	PreviewComponents.Reset();

	if (InTargetPracticeRound == nullptr)
	{
		return;
	}

	int32 NumWaves = InTargetPracticeRound->Waves.Num();
	PreviewComponents.AddDefaulted(NumWaves);

	for (int32 WaveIndex = 0; WaveIndex < NumWaves; WaveIndex++)
	{
		const FTargetWave& Wave = InTargetPracticeRound->Waves[WaveIndex];
		TArray<UStaticMeshComponent*>& WaveComponents = PreviewComponents[WaveIndex];

		WaveComponents.Reserve(Wave.Targets.Num());
		for (const auto& Target : Wave.Targets)
		{
			UStaticMeshComponent* Component = NewObject<UStaticMeshComponent>();
            Component->SetStaticMesh(PreviewMesh);
			Component->SetCustomPrimitiveDataVector4(0, FVector4(Target.Color));

			PreviewScene->AddComponent(Component, Target.Transform);

			WaveComponents.Add(Component);
		}
	}
}
{% endhighlight %}

Note that the material for this mesh is set up to receive color via
[Custom Primitive Data][2]. Systems that assign textures or projects on older
engine versions would have to create and track a `UMaterialInstanceDynamic` per
component. The material is available in the Github repository for this
tutorial.

Finally, we can invoke `SetPreviewRound` at the very end of `Construct` to initialize it when the editor opens.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.cpp" %}
{% highlight cpp linenos %}
void STargetPracticeRoundEditorViewport::Construct(const FArguments& InArgs)
{
    // ...

    SetPreviewRound(TargetPracticeRound);
}
{% endhighlight %}

The viewport is now populated with targets. The camera is still placed at the
origin, and the components do not update when edited via the Details panel or
when the asset is reimported. There is also no way to interact with the
viewport besides manipulating the camera.

[![][img5]][img5]{: data-lightbox="img5"}

## Update Viewport on Asset Change

Next up is to write some code that updates the components in the viewport as
the user edits properties in the Details panel. While it would be possible to
simply remove the Details panel and rely entirely on viewport interactions and
custom tabs to change data, I believe it is still a good idea to keep the
details panel around for debugging and validation, even if it's hidden by
default.

Normally, we would override `PostEditChangeProperty` on the object itself to
run some code when a property is changed in the editor. But because we are
trying to examine changes to our object externally (in the viewport), we must
bind to the global property changed delegate and filter for our object.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.h" %}
{% highlight cpp linenos %}
class STargetPracticeRoundEditorViewport : public SAssetEditorViewport, public FGCObject
{
// ...
private:
    // ...
    void OnObjectPropertyChanged(UObject* ObjectBeingModified, FPropertyChangedEvent& PropertyChangedEvent);
};
{% endhighlight %}

The delegate is bound in `Construct()` and unbound in the destructor.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.cpp" %}
{% highlight cpp linenos %}
void STargetPracticeRoundEditorViewport::Construct(const FArguments& InArgs)
{
    // ...

    FCoreUObjectDelegates::OnObjectPropertyChanged.AddSP(this, &STargetPracticeRoundEditorViewport::OnObjectPropertyChanged);
}

STargetPracticeRoundEditorViewport::~STargetPracticeRoundEditorViewport()
{
    FCoreUObjectDelegates::OnObjectPropertyChanged.RemoveAll(this);

    // ...
}
{% endhighlight %}

Then we implement `OnObjectPropertyChanged`. The data provided to this
function is not enough to figure out which target was edited specifically. We
could try to update all components in-place when we detect that the `Color` or
`Transform` of a target has been edited, but the added complexity is not worth
it for the small number of components we would be allocating here. This will
also handle undo/redo.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.cpp" %}
{% highlight cpp linenos %}
void STargetPracticeRoundEditorViewport::OnObjectPropertyChanged(UObject* ObjectBeingModified, FPropertyChangedEvent& PropertyChangedEvent)
{
	if (ObjectBeingModified == TargetPracticeRound)
	{
		SetPreviewRound(TargetPracticeRound);
	}
}
{% endhighlight %}

Now we have a viewport that stays synchronized with asset data, which is
already an improvement over the standard DataAsset editor.

{% include video.html src="/img/unreal/BeyondDataAsset/DetailsPanelViewport.webm" %}

-------------------------------------------------------------------------------

In part 4, we will look at adding interactions to the viewport, extending the
toolbar, and adding custom Slate widgets as tabs.

[1]: https://docs.unrealengine.com/en-US/ProgrammingAndScripting/Slate/Overview/index.html
[2]: https://docs.unrealengine.com/en-US/RenderingAndGraphics/Materials/CustomPrimitiveData/index.html
[img1]: /img/unreal/BeyondDataAsset/BlankAssetEditor.png "Blank AssetEditor"
[img2]: /img/unreal/BeyondDataAsset/AssetEditorWithToolbar.png "Standard Toolbar"
[img3]: /img/unreal/BeyondDataAsset/AssetEditorWithDetails.png "Details View"
[img4]: /img/unreal/BeyondDataAsset/AssetEditorWithViewport.png "Viewport"
[img5]: /img/unreal/BeyondDataAsset/PreviewComponents.png "Preview Components"