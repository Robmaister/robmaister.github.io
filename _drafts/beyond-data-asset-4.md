---
layout: post
status: publish
published: true
comments: true
has-code: true
has-lightbox: true
title: Beyond DataAsset - Viewport Interaction (Part 4)
date: '2020-12-15 00:00:00 -0700'
tags: [unreal, data-asset, c++]
preview-img:
    url: /img/blog/2015/10/20151023_113508.jpg
    alt: VR for G3
---

With a simple editor set up in part 3, we will now look at building out a
workflow within that editor, including interactions within the viewport and
custom Slate UI.

The first and arguably most important improvement we can make is allowing
selection and manipulation of the targets within the viewport, using the
standard Unreal transformation widget.

# Viewport Selection

If you have made a custom `FEdMode` implementation, this will look familiar.
However, it will not work out-of-the-box in the same way. Once the selection
logic is set up, we will go back and modify our components to satisfy the
engine's requirements for component selection.

## Tracking Selection

To start, we will add selection tracking data to `FTargetPracticeRoundEditor`,
along with a basic API. We are storing our data here so that it can be
accessed not only by the viewport, but also toolbar buttons and any custom
tabs we add in the future. We are also not storing component pointers here,
since the components will be recreated periodically by the viewport when data
changes. 

This API is borrowed from `FStaticMeshEditor`, where it was originally used to
track the selection of collision primitives.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.h" %}
{% highlight cpp linenos %}
struct FTargetIndex
{
	int32 WaveIndex;
	int32 TargetIndex;

    static const FTargetIndex None;

	FTargetIndex(int32 InWaveIndex, int32 InTargetIndex)
		: WaveIndex(InWaveIndex)
		, TargetIndex(InTargetIndex)
	{}

    bool IsValid(UTargetPracticeRound* InRound) const;

	bool operator==(const FTargetIndex& Other) const
	{
		return (WaveIndex == Other.WaveIndex)
			&& (TargetIndex == Other.TargetIndex);
	}

	bool operator!=(const FTargetIndex& Other) const
	{
		return !(*this == Other);
	}
};

class FTargetPracticeRoundEditor : public FAssetEditorToolkit, public FGCObject
{
public:
    // ...

	const TArray<FTargetIndex>& GetSelectedTargets() const { return SelectedTargets; }
    bool HasSelectedTargets() const;
	bool IsTargetSelected(const FTargetIndex& InTarget) const;
	void AddSelectedTarget(const FTargetIndex& InTarget, bool bClearSelection);
	void RemoveSelectedTarget(const FTargetIndex& InTarget);
	void ClearSelectedTargets();

private:
    // ...

    TArray<FTargetIndex> SelectedTargets;
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.cpp" %}
{% highlight cpp linenos %}
// ...

const FTargetIndex FTargetIndex::None(INDEX_NONE, INDEX_NONE);

// ...

bool FTargetIndex::IsValid(UTargetPracticeRound* InRound) const
{
	return InRound 
		&& InRound->Waves.IsValidIndex(WaveIndex) 
		&& InRound->Waves[WaveIndex].Targets.IsValidIndex(TargetIndex);
}

// ...

bool FTargetPracticeRoundEditor::HasSelectedTargets() const
{
	return SelectedTargets.Num() > 0;
}

bool FTargetPracticeRoundEditor::IsTargetSelected(const FTargetIndex& InTarget) const
{
	return SelectedTargets.Contains(InTarget);
}

void FTargetPracticeRoundEditor::AddSelectedTarget(const FTargetIndex& InTarget, bool bClearSelection)
{
	check(InTarget.IsValid(EditingTargetPracticeRound));

	if (bClearSelection)
	{
		ClearSelectedTargets();
	}

	SelectedTargets.Add(InTarget);
}

void FTargetPracticeRoundEditor::RemoveSelectedTarget(const FTargetIndex& InTarget)
{
	SelectedTargets.Remove(InTarget);
}

void FTargetPracticeRoundEditor::ClearSelectedTargets()
{
	SelectedTargets.Empty();
}
{% endhighlight %}

## Click Handling

Now that we have a way to track which targets are selected, we can override
the `ProcessClick` function in our Viewport Client. This function provides a
lot of information about a mouse click, but what we need is the `HHitProxy`,
if one is provided.

Hit Proxies are objects provided to Unreal's renderer that help map a pixel
back to a component, actor, or other interactable entity on screen. It is
possible to create your own `HHitProxy` subclasses, but for the purposes of
this tutorial we only care about `HActor`.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditorViewportClient.h" %}
{% highlight cpp linenos %}
class FTargetPracticeRoundEditorViewportClient : public FEditorViewportClient, public TSharedFromThis<FTargetPracticeRoundEditorViewportClient>
{
public:
    // ...
    virtual void ProcessClick(FSceneView& View, HHitProxy* HitProxy, FKey Key, EInputEvent Event, uint32 HitX, uint32 HitY) override;
    // ...
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditorViewportClient.cpp" %}
{% highlight cpp linenos %}
#include "EngineUtils.h"
#include "TargetPracticeRound.h"
#include "TargetPracticeRoundEditor.h"

// ...

void FTargetPracticeRoundEditorViewportClient::ProcessClick(FSceneView& View, HHitProxy* HitProxy, FKey Key, EInputEvent Event, uint32 HitX, uint32 HitY)
{
	bool bClearTargetSelection = true;

	if (HitProxy)
	{
		if (HitProxy->IsA(HActor::StaticGetType()))
		{
			HActor* ActorProxy = (HActor*)HitProxy;
			UStaticMeshComponent* HitComponent = Cast<UStaticMeshComponent>(const_cast<UPrimitiveComponent*>(ActorProxy->PrimComponent));

			FTargetIndex FoundTarget = TargetPracticeRoundEditorViewportPtr.Pin()->FindTargetIndexForPreviewComponent(HitComponent);
			if (FoundTarget != FTargetIndex::None)
			{
				TargetPracticeRoundEditorPtr.Pin()->AddSelectedTarget(FoundTarget, true);
				bClearTargetSelection = false;
			}
		}
	}

	if (bClearTargetSelection)
	{
		TargetPracticeRoundEditorPtr.Pin()->ClearSelectedTargets();
	}

    FEditorViewportClient::ProcessClick(View, HitProxy, Key, Event, HitX, HitY);
}
{% endhighlight %}

In this implementation, we check if a component was clicked, and if it was, we
try to match it to one of the components we created in our Viewport. Unless
all of these conditions are met, we will clear the selection as it is usually
expected that clicking the background will clear any selection made.

Note that the use of `const_cast` here is due to a limitation of `TArray` not
being able to take const pointers as arguments in `Find` or `Contains`. The
same cast is done in `FDataprepEditorViewportClient::ProcessClick`.

The implementation of `FindTargetIndexForPreviewComponent` from above goes in
our Viewport class

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.h" %}
{% highlight cpp linenos %}
class STargetPracticeRoundEditorViewport : public SAssetEditorViewport, public FGCObject
{
public:
    // ...
    FTargetIndex FindTargetIndexForPreviewComponent(UStaticMeshComponent* InComponent) const;
    // ...
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.cpp" %}
{% highlight cpp linenos %}
FTargetIndex STargetPracticeRoundEditorViewport::FindTargetIndexForPreviewComponent(UStaticMeshComponent* InComponent) const
{
	for (int32 WaveIndex = 0; WaveIndex < PreviewComponents.Num(); WaveIndex++)
	{
		int32 TargetIndex;
		if (PreviewComponents[WaveIndex].Find(InComponent, TargetIndex))
		{
			return FTargetIndex(WaveIndex, TargetIndex);
		}
	}

	return FTargetIndex::None;
}
{% endhighlight %}

If you were to compile and run the editor now with a breakpoint set in
`ProcessClick`, you would see that `HitProxy` is null, regardless of whether
or not a target was clicked on. This is because we never made an actor to
contain our preview components. As a reference, the function that enforces
this restriction is `FPrimitiveSceneProxy::CreateHitProxies`.

An actor is not necessary for anything here besides selection, so we will make
an basic actor with a SceneComponent root and attach all of our preview
components to it. Initialization changes from direct interaction with the
scene to component registration and use of the `UWorld` created with the scene.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.h" %}
{% highlight cpp linenos %}
class AActor;

class STargetPracticeRoundEditorViewport : public SAssetEditorViewport, public FGCObject
{
    // ...
private:
    // ...
    AActor* PreviewActor;
    // ...
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.cpp" %}
{% highlight cpp linenos %}
void STargetPracticeRoundEditorViewport::Construct(const FArguments& InArgs)
{
    // ...
    PreviewActor = PreviewScene->GetWorld()->SpawnActor<AActor>(AActor::StaticClass(), FTransform::Identity);
	USceneComponent* RootComponent = NewObject<USceneComponent>(PreviewActor);
	PreviewActor->SetRootComponent(RootComponent);
	PreviewActor->RegisterAllComponents();

    SetPreviewRound(TargetPracticeRound);
    // ...
}
// ...
void STargetPracticeRoundEditorViewport::AddReferencedObjects(FReferenceCollector& Collector)
{
	// ...
	Collector.AddReferencedObject(PreviewActor);
	// ...
}
// ...
void STargetPracticeRoundEditorViewport::SetPreviewRound(UTargetPracticeRound* InTargetPracticeRound)
{
	for (auto& WaveComponents : PreviewComponents)
	{
		for (auto& Component : WaveComponents)
		{
			Component->DestroyComponent();
		}
	}
    // ...
    for (int32 WaveIndex = 0; WaveIndex < NumWaves; WaveIndex++)
	{
        // ...
        for (const auto& Target : Wave.Targets)
		{
			UStaticMeshComponent* Component = NewObject<UStaticMeshComponent>(PreviewActor);
			Component->SetStaticMesh(PreviewMesh);
			Component->SetCustomPrimitiveDataVector4(0, FVector4(Target.Color));
			Component->AttachToComponent(PreviewActor->GetRootComponent(), FAttachmentTransformRules::KeepRelativeTransform);
			Component->SetRelativeTransform(Target.Transform);
			Component->RegisterComponent();

			WaveComponents.Add(Component);
		}
    }
}
{% endhighlight %}

Now with the addition of the preview actor as well as switching from direct
scene addition to component registration, `ProcessClick` gets a valid HitProxy
and `FTargetPracticeRoundEditor::AddSelectedTarget` gets called correctly.

Now the cursor becomes a crosshair when hovering over a target, but selecting
a target does not create the selection outline that would normally be there
when selecting actors in a level or components in a Blueprint.

## Selection Outline

Unreal normally tracks selections in a level via `USelection`, but that is
assumed to be scoped to all of the levels that are currently loaded.
AssetEditors like ours are expected to track their own selection, and a
delegate is provided in `UPrimitiveComponent` to bind to external selection
tracking.

First, we will define a function in our Viewport class that matches the
signature of the delegate `UPrimitiveComponent::FSelectionOverride`.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.h" %}
{% highlight cpp linenos %}
class STargetPracticeRoundEditorViewport : public SAssetEditorViewport, public FGCObject
{
public:
    // ...
	bool IsTargetSelected(const UPrimitiveComponent* InComponent);
    // ...
};
{% endhighlight %}

Then we will write the implementation and bind each component to it. Note that
the components are now added to `WaveComponents` before it is registered.

Component registration is where the selection override delegate is invoked, so
if we are calling `SetPreviewRound` to recreate the components for details
panel changes, we want selection to persist across the function call. Adding
to our component array earlier ensures that `IsTargetSelected` will find the
component and return a valid result.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.cpp" %}
{% highlight cpp linenos %}
void STargetPracticeRoundEditorViewport::SetPreviewRound(UTargetPracticeRound* InTargetPracticeRound)
{
    // ...

    for (int32 WaveIndex = 0; WaveIndex < NumWaves; WaveIndex++)
	{
        // ...

        for (const auto& Target : Wave.Targets)
		{
			UStaticMeshComponent* Component = NewObject<UStaticMeshComponent>(PreviewActor);
			// ...
			Component->SelectionOverrideDelegate = UPrimitiveComponent::FSelectionOverride::CreateSP(this, &STargetPracticeRoundEditorViewport::IsTargetSelected);
			// ...
			WaveComponents.Add(Component);
			Component->RegisterComponent();
		}
    }
}
// ...
bool STargetPracticeRoundEditorViewport::IsTargetSelected(const UPrimitiveComponent* InComponent)
{
	UStaticMeshComponent* PreviewComponent = Cast<UStaticMeshComponent>(const_cast<UPrimitiveComponent*>(InComponent));
	return TargetPracticeRoundEditorPtr.Pin()->IsTargetSelected(FindTargetIndexForPreviewComponent(PreviewComponent));
}
{% endhighlight %}

Our selection function makes the same `const_cast` as before, then converts
the component to a `FTargetIndex` and passes that along to the API we set up
in `FTargetPracticeRoundEditor`. Now the component will know that it is
selected but we won't see the outline just yet.

We need to enable selection outlines for this viewport via `EngineShowFlags`.
ShowFlags are the engine's way of toggling various rendering features per
viewport. You are most likely familiar with them from the dropdown on the top
left corner of the level editor viewport, next to the view mode dropdown.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditorViewportClient.cpp" %}
{% highlight cpp linenos %}
FTargetPracticeRoundEditorViewportClient::FTargetPracticeRoundEditorViewportClient(TWeakPtr<FTargetPracticeRoundEditor> InTargetPracticeRoundEditor, const TSharedRef<STargetPracticeRoundEditorViewport>& InTargetPracticeRoundEditorViewport, const TSharedRef<FAdvancedPreviewScene>& InPreviewScene, UTargetPracticeRound* InTargetPracticeRound)
	// ...
{
	// ...
	EngineShowFlags.SetSelectionOutline(true);
}
{% endhighlight %}

If you would like to test this now and see selection outlines, you can call
`HitComponent->PushSelectionToProxy();` inside `ProcessClick`. You will notice
that components never have their selection outlines removed, though. So the
last thing we need to do is push selection updates whenever any selection
change happens.

This will be implemented as a multicast delegate in
`FTargetPracticeRoundEditor` that the Viewport will bind to. For simplicity,
no arguments will be passed. All components will have their selection updated
whenever any selection change happens.

Because `AddSelectedTarget` can call `ClearSelectedTargets` internally, we
will also add an argument to `ClearSelectedTargets` that can prevent
broadcasting the delegate a second time in this case.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.h" %}
{% highlight cpp linenos %}
class FTargetPracticeRoundEditor : public FAssetEditorToolkit, public FGCObject
{
public:
	// ...
	void ClearSelectedTargets(bool bBroadcastSelection = true);
	// ...
	DECLARE_MULTICAST_DELEGATE(FOnSelectionChanged);
	FOnSelectionChanged OnSelectionChanged;
	// ...
};
{% endhighlight %}

Then, we fire this delegate in all of our selection functions.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.cpp" %}
{% highlight cpp linenos %}
void FTargetPracticeRoundEditor::AddSelectedTarget(const FTargetIndex& InTarget, bool bClearSelection)
{
	// ...
	OnSelectionChanged.Broadcast();
}

void FTargetPracticeRoundEditor::RemoveSelectedTarget(const FTargetIndex& InTarget)
{
	// ...
	OnSelectionChanged.Broadcast();
}

void FTargetPracticeRoundEditor::ClearSelectedTargets(bool bBroadcastSelection = true)
{
	// ...
	if (bBroadcastSelection)
	{
		OnSelectionChanged.Broadcast();
	}
}
{% endhighlight %}

Next, we will bind to this delegate from the viewport and update selection on
all of our components.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.h" %}
{% highlight cpp linenos %}
class STargetPracticeRoundEditorViewport : public SAssetEditorViewport, public FGCObject
{
	// ...
private:
	// ...
	void OnTargetSelectionChanged();
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.cpp" %}
{% highlight cpp linenos %}
void STargetPracticeRoundEditorViewport::Construct(const FArguments& InArgs)
{
	// ...
	PinnedEditor->OnSelectionChanged.AddSP(this, &STargetPracticeRoundEditorViewport::OnTargetSelectionChanged);
	// ...
}
// ...
STargetPracticeRoundEditorViewport::~STargetPracticeRoundEditorViewport()
{
	// ...
	if (TargetPracticeRoundEditorPtr.IsValid())
	{
		TargetPracticeRoundEditorPtr.Pin()->OnSelectionChanged.RemoveAll(this);
	}
	// ...
}
// ...
void STargetPracticeRoundEditorViewport::OnTargetSelectionChanged()
{
	for (const auto& WaveComponents : PreviewComponents)
	{
		for (const auto& TargetComponent : WaveComponents)
		{
			TargetComponent->PushSelectionToProxy();
		}
	}
}
{% endhighlight %}

Selection should now look like it does throughout the rest of the engine, but
for only one target being selected at a time.

{% include video.html src="/img/unreal/BeyondDataAsset/ComponentSelection.webm" %}

## Multi-Selection

Most of the code here was set up with multi-seleciton in mind, we just need to
revisit `ProcessClick` and add some complexity.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditorViewportClient.cpp" %}
{% highlight cpp linenos %}
void FTargetPracticeRoundEditorViewportClient::ProcessClick(FSceneView& View, HHitProxy* HitProxy, FKey Key, EInputEvent Event, uint32 HitX, uint32 HitY)
{
	const bool bCtrlDown = Viewport->KeyState(EKeys::LeftControl) || Viewport->KeyState(EKeys::RightControl);
	// ...
	if (HitProxy)
	{
		if (HitProxy->IsA(HActor::StaticGetType()))
		{
			// ...
			if (FoundTarget != FTargetIndex::None)
			{
				if (TargetPracticeRoundEditorPtr.Pin()->IsTargetSelected(FoundTarget))
				{
					if (!bCtrlDown)
					{
						TargetPracticeRoundEditorPtr.Pin()->AddSelectedTarget(FoundTarget, true);
					}
					else
					{
						TargetPracticeRoundEditorPtr.Pin()->RemoveSelectedTarget(FoundTarget);
					}
				}
				else
				{
					TargetPracticeRoundEditorPtr.Pin()->AddSelectedTarget(FoundTarget, !bCtrlDown);
				}
				
				bClearTargetSelection = false;
			}
		}
	}
	// ...
}
{% endhighlight %}

This structure of conditions is found in many parts of the engine, it changes
what happens when ctrl is pressed and a target is selected.

  - Targets that were already selected are deselected
  - Targets that were not already selected are selected without clearing the
	existing selection.

## Undo/Redo Handling

It is possible for the addition or removal of a target to be undone or redone.
Because we are tracking indices, this is the only way that our selection array
could contain invalid indices at the moment.

We are not operationg on selected targets yet, but this would be a problem
when we do. We handle this by registering our Editor class for undo/redo
notifications and checking our selection array for invalid indices.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.h" %}
{% highlight cpp linenos %}
class FTargetPracticeRoundEditor : public FAssetEditorToolkit, public FGCObject, public FEditorUndoClient
{
public:
	// ...
	~FTargetPracticeRoundEditor();
	// ...
	void RemoveInvalidSelectedTargets();
	// ...
private:
	virtual void PostUndo(bool bSuccess) override;
	virtual void PostRedo(bool bSuccess) override;
	// ...
};
{% endhighlight %}

The undo client needs to be registered and unregistered in addition to
implementing these functions. The destructor was declared above for this
purpose.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.cpp" %}
{% highlight cpp linenos %}
FTargetPracticeRoundEditor::~FTargetPracticeRoundEditor()
{
	GEditor->UnregisterForUndo(this);
}
// ...
void FTargetPracticeRoundEditor::InitTargetPracticeRoundEditor(const EToolkitMode::Type Mode, const TSharedPtr<class IToolkitHost>& InitToolkitHost, UTargetPracticeRound* ObjectToEdit)
{
	// ...
	GEditor->RegisterForUndo(this);
	// ...
}
// ...
void FTargetPracticeRoundEditor::RemoveInvalidSelectedTargets()
{
	SelectedTargets.RemoveAll([&](const FTargetIndex& Index)
	{
		return !Index.IsValid(EditingTargetPracticeRound);
	});
}
// ...
void FTargetPracticeRoundEditor::PostUndo(bool bSuccess)
{
	RemoveInvalidSelectedTargets();
}

void FTargetPracticeRoundEditor::PostRedo(bool bSuccess)
{
	RemoveInvalidSelectedTargets();
}
{% endhighlight %}

# Transformation Widget

The lack of a transformation widget is the main reason to create a custom
AssetEditor with a Viewport, at least for the asset class used in this
tutorial. There is still a benefit to editing target colors as they are
previewed on the same mesh that is used in the game, but given the colors are
visible in the Details panel it is nowhere near as hard to edit.

## Setup

The transformation widget is controlled by the Viewport Client, there are a
number of functions that need to be overridden to control the widget. We will
implement those functions using some new member variables.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditorViewportClient.h" %}
{% highlight cpp linenos %}
class FTargetPracticeRoundEditorViewportClient : public FEditorViewportClient, public TSharedFromThis<FTargetPracticeRoundEditorViewportClient>
{
public:
	// ...
	virtual FWidget::EWidgetMode GetWidgetMode() const override;
	virtual void SetWidgetMode(FWidget::EWidgetMode NewMode) override;
	virtual bool CanSetWidgetMode(FWidget::EWidgetMode NewMode) const override;
	virtual bool CanCycleWidgetMode() const override;
	virtual FVector GetWidgetLocation() const override;
	virtual FMatrix GetWidgetCoordSystem() const override;
	virtual ECoordSystem GetWidgetCoordSystemSpace() const override;
	virtual void SetWidgetCoordSystemSpace(ECoordSystem NewCoordSystem) override;

private:
	// ...
	bool bManipulating;
	FWidget::EWidgetMode WidgetMode;
	ECoordSystem WidgetCoordSystem;
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditorViewportClient.h" %}
{% highlight cpp linenos %}
FTargetPracticeRoundEditorViewportClient::FTargetPracticeRoundEditorViewportClient(TWeakPtr<FTargetPracticeRoundEditor> InTargetPracticeRoundEditor, const TSharedRef<STargetPracticeRoundEditorViewport>& InTargetPracticeRoundEditorViewport, const TSharedRef<FAdvancedPreviewScene>& InPreviewScene, UTargetPracticeRound* InTargetPracticeRound)
	// ...
	, bManipulating(false)
	, WidgetMode(FWidget::WM_Translate)
	, WidgetCoordSystem(COORD_Local)
{
	// ...
}
// ...
FWidget::EWidgetMode FTargetPracticeRoundEditorViewportClient::GetWidgetMode() const
{
	if (TargetPracticeRoundEditorPtr.Pin()->HasSelectedTargets())
	{
		return WidgetMode;
	}

	return FWidget::WM_Max;
}

void FTargetPracticeRoundEditorViewportClient::SetWidgetMode(FWidget::EWidgetMode NewMode)
{
	WidgetMode = NewMode;
	Invalidate();
}

bool FTargetPracticeRoundEditorViewportClient::CanSetWidgetMode(FWidget::EWidgetMode NewMode) const
{
	if (!Widget->IsDragging())
	{
		if (TargetPracticeRoundEditorPtr.Pin()->HasSelectedTargets())
		{
			return true;
		}
	}
	return false;
}

bool FTargetPracticeRoundEditorViewportClient::CanCycleWidgetMode() const
{
	if (!Widget->IsDragging())
	{
		if (TargetPracticeRoundEditorPtr.Pin()->HasSelectedTargets())
		{
			return true;
		}
	}
	return false;
}

FVector FTargetPracticeRoundEditorViewportClient::GetWidgetLocation() const
{
	FTargetIndex SelectedTarget = TargetPracticeRoundEditorPtr.Pin()->GetFirstSelectedTarget();
	if (SelectedTarget != FTargetIndex::None)
	{
		const FTransform& TargetTransform = SelectedTarget.GetTargetTransform(TargetPracticeRound);
		return TargetTransform.GetLocation();
	}

	return FVector::ZeroVector;
}

FMatrix FTargetPracticeRoundEditorViewportClient::GetWidgetCoordSystem() const
{
	if (WidgetCoordSystem == COORD_Local)
	{
		FTargetIndex SelectedTarget = TargetPracticeRoundEditorPtr.Pin()->GetFirstSelectedTarget();
		if (SelectedTarget != FTargetIndex::None)
		{
			const FTransform& TargetTransform = SelectedTarget.GetTargetTransform(TargetPracticeRound);
			return FRotationMatrix(TargetTransform.Rotator());
		}
	}

	return FMatrix::Identity;
}

ECoordSystem FTargetPracticeRoundEditorViewportClient::GetWidgetCoordSystemSpace() const
{
	return WidgetCoordSystem;
}

void FTargetPracticeRoundEditorViewportClient::SetWidgetCoordSystemSpace(ECoordSystem NewCoordSystem)
{
	WidgetCoordSystem = NewCoordSystem;
}
{% endhighlight %}

Now we need the implementations of `FTargetIndex::GetTransform` and
`FTargetPracticeRoundEditor::GetFirstSelectedTarget`.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.h" %}
{% highlight cpp linenos %}
struct FTargetIndex
{
	// ...
	FTransform& GetTargetTransform(UTargetPracticeRound* InRound) const;
	// ...
};

class FTargetPracticeRoundEditor : public FAssetEditorToolkit, public FGCObject, public FEditorUndoClient
{
public:
	// ...
	FTargetIndex GetFirstSelectedTarget() const;
	// ...
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.h" %}
{% highlight cpp linenos %}
FTransform& FTargetIndex::GetTargetTransform(UTargetPracticeRound* InRound) const
{
	check(IsValid(InRound));

	return InRound->Waves[WaveIndex].Targets[TargetIndex].Transform;
}
// ...
FTargetIndex FTargetPracticeRoundEditor::GetFirstSelectedTarget() const
{
	if (HasSelectedTargets())
	{
		return SelectedTargets[0];
	}

	return FTargetIndex::None;
}
{% endhighlight %}

Note that the selection of the first target is arbitrary and based on the way
the StaticMeshEditor handles simple collision primitives. Selecting the last
target is also valid, as would be computing some sort of average coordinate
space.

If you were to compile and launch the editor at this point, you would be able
to select a rotated target, press W to set the translation widget mode, and
see that the widget is oriented locally to that target. Dragging a handle of
the widget does not work yet, and instead the camera is translated.

[![][img1]][img1]{: data-lightbox="img1"}

## Viewport Widget

If you compiled the editor you may have noticed that you could only set the
widget mode via the keyboard shortcut. Normally all viewports have this set of
buttons along the top edge, but ours does not.

[![][img2]][img2]{: data-lightbox="img2"}

Implementing it is relatively straightforward. The widget containing most of
those buttons is `SCommonEditorViewportToolbarBase`. You can extend this to
add extra buttons, but for now we will use the base class. This widget
requires it's container (in our case, our Viewport) to implement an interface,
which we will do now.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.h" %}
{% highlight cpp linenos %}
#include "SCommonEditorViewportToolbarBase.h"
// ...
class STargetPracticeRoundEditorViewport : public SAssetEditorViewport, public FGCObject, public ICommonEditorViewportToolbarInfoProvider
{
public:
	// ...
	virtual TSharedRef<class SEditorViewport> GetViewportWidget() override;
	virtual TSharedPtr<FExtender> GetExtenders() const override;
	virtual void OnFloatingButtonClicked() override;

protected:
	// ...
	virtual TSharedPtr<SWidget> MakeViewportToolbar() override;
	// ...
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.cpp" %}
{% highlight cpp linenos %}
TSharedRef<class SEditorViewport> STargetPracticeRoundEditorViewport::GetViewportWidget()
{
	return SharedThis(this);
}

TSharedPtr<FExtender> STargetPracticeRoundEditorViewport::GetExtenders() const
{
	TSharedPtr<FExtender> Result(MakeShareable(new FExtender));
	return Result;
}

void STargetPracticeRoundEditorViewport::OnFloatingButtonClicked()
{
}
// ...
TSharedPtr<SWidget> STargetPracticeRoundEditorViewport::MakeViewportToolbar()
{
	return SNew(SCommonEditorViewportToolbarBase, SharedThis(this));
}
{% endhighlight %}

Now we can see the toolbar, and adjust our widget through it.

[![][img3]][img3]{: data-lightbox="img3"}

## Widget Manipulation

Now that we have a normal looking widget, we must make it act normally.
`FEditorViewportClient` internally tracks mouse dragging and provides delta
translation, rotation, and scale in world space via the virtual function
`InputWidgetDelta`. Two additional functions, `TrackingStarted` and
`TrackingStopped` are called before the start of any dragging action and after
the end of any dragging action, respectively.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditorViewportClient.h" %}
{% highlight cpp linenos %}
class FTargetPracticeRoundEditorViewportClient : public FEditorViewportClient, public TSharedFromThis<FTargetPracticeRoundEditorViewportClient>
{
public:
	// ...
	virtual void TrackingStarted(const struct FInputEventState& InInputState, bool bIsDraggingWidget, bool bNudge) override;
	virtual void TrackingStopped() override;
	virtual bool InputWidgetDelta(FViewport* InViewport, EAxisList::Type CurrentAxis, FVector& Drag, FRotator& Rot, FVector& Scale) override;
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditorViewportClient.cpp" %}
{% highlight cpp linenos %}
void FTargetPracticeRoundEditorViewportClient::TrackingStarted(const FInputEventState& InInputState, bool bIsDraggingWidget, bool bNudge)
{
	if (!bManipulating && bIsDraggingWidget)
	{
		bManipulating = true;
	}
}

void FTargetPracticeRoundEditorViewportClient::TrackingStopped()
{
	if (bManipulating)
	{
		bManipulating = false;
	}
}

bool FTargetPracticeRoundEditorViewportClient::InputWidgetDelta(FViewport* InViewport, EAxisList::Type CurrentAxis, FVector& Drag, FRotator& Rot, FVector& Scale)
{
	bool bHandled = FEditorViewportClient::InputWidgetDelta(InViewport, CurrentAxis, Drag, Rot, Scale);
	if (!bHandled && bManipulating)
	{
		if (CurrentAxis != EAxisList::None)
		{
			const FWidget::EWidgetMode MoveMode = GetWidgetMode();
			if (MoveMode == FWidget::WM_Rotate)
			{
				TargetPracticeRoundEditorPtr.Pin()->RotateSelectedTargets(Rot);
			}
			else if (MoveMode == FWidget::WM_Scale)
			{
				TargetPracticeRoundEditorPtr.Pin()->ScaleSelectedTargets(Scale);
			}
			else if (MoveMode == FWidget::WM_Translate)
			{
				TargetPracticeRoundEditorPtr.Pin()->TranslateSelectedTargets(Drag);
			}
		}

		Invalidate();
		bHandled = true;
	}

	return bHandled;
}
{% endhighlight %}

This implementation so far toggles our `bManipulating` variable and calls out
3 functions in our Editor class while dragging. Instead of directly changing
transforms in the asset here, handling it in the Editor class both maintains
encapsulation and gives us an opportunity to broadcast another delegate so
that the viewport and other tabs have an opportunity to react to the change.

The implementation of these 3 functions is straightforward.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.h" %}
{% highlight cpp linenos %}
class FTargetPracticeRoundEditor : public FAssetEditorToolkit, public FGCObject, public FEditorUndoClient
{
public:
	// ...
	void TranslateSelectedTargets(const FVector& Drag);
	void RotateSelectedTargets(const FRotator& Rot);
	void ScaleSelectedTargets(const FVector& Scale);
	
	DECLARE_MULTICAST_DELEGATE_OneParam(FOnTransformChanged, const FTargetIndex&);
	FOnTransformChanged OnTransformChanged;
	// ...
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.cpp" %}
{% highlight cpp linenos %}
void FTargetPracticeRoundEditor::TranslateSelectedTargets(const FVector& Drag)
{
	for (const auto& Target : SelectedTargets)
	{
		FTransform& TargetTransform = Target.GetTargetTransform(EditingTargetPracticeRound);
		TargetTransform.AddToTranslation(Drag);

		OnTransformChanged.Broadcast(Target);
	}

	EditingTargetPracticeRound->MarkPackageDirty();
}

void FTargetPracticeRoundEditor::RotateSelectedTargets(const FRotator& Rot)
{
	for (const auto& Target : SelectedTargets)
	{
		FTransform& TargetTransform = Target.GetTargetTransform(EditingTargetPracticeRound);
		TargetTransform.ConcatenateRotation(FQuat(Rot));

		OnTransformChanged.Broadcast(Target);
	}

	EditingTargetPracticeRound->MarkPackageDirty();
}

void FTargetPracticeRoundEditor::ScaleSelectedTargets(const FVector& Scale)
{
	for (const auto& Target : SelectedTargets)
	{
		FTransform& TargetTransform = Target.GetTargetTransform(EditingTargetPracticeRound);
		TargetTransform.SetScale3D(TargetTransform.GetScale3D() + Scale);

		OnTransformChanged.Broadcast(Target);
	}

	EditingTargetPracticeRound->MarkPackageDirty();
}
{% endhighlight %}

Compiling now, you would see the widget move but the components do not follow
until the AssetEditor is closed and re-opened. To fix this, the viewport now
has to listen for transform changes and update the correct components in
`PreviewComponents`.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.h" %}
{% highlight cpp linenos %}
class STargetPracticeRoundEditorViewport : public SAssetEditorViewport, public FGCObject, public ICommonEditorViewportToolbarInfoProvider
{
	// ...
private:
	// ...
	void OnTargetTransformChanged(FTargetIndex InIndex);
	// ...
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/STargetPracticeRoundEditorViewport.cpp" %}
{% highlight cpp linenos %}
void STargetPracticeRoundEditorViewport::Construct(const FArguments& InArgs)
{
	// ...
	PinnedEditor->OnTransformChanged.AddSP(this, &STargetPracticeRoundEditorViewport::OnTargetTransformChanged);
	// ...
}
// ...
STargetPracticeRoundEditorViewport::~STargetPracticeRoundEditorViewport()
{
	// ...
	if (TargetPracticeRoundEditorPtr.IsValid())
	{
		//...
		TargetPracticeRoundEditorPtr.Pin()->OnTransformChanged.RemoveAll(this);
	}
	//...
}
// ...
void STargetPracticeRoundEditorViewport::OnTargetTransformChanged(const FTargetIndex& InIndex)
{
	const FTarget& Target = TargetPracticeRound->Waves[InIndex.WaveIndex].Targets[InIndex.TargetIndex];
	PreviewComponents[InIndex.WaveIndex][InIndex.TargetIndex]->SetRelativeTransform(Target.Transform);
}
{% endhighlight %}

We now have functional target editing via Unreal widget.

{% include video.html src="/img/unreal/BeyondDataAsset/WidgetManipulation.webm" %}

## Undo/Redo

None of our widget manipulations are being captured as transactions for
undo/redo. Adding support is quite simple, and makes `TrackingStarted` and
`TrackingStopped` more useful.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditorViewportClient.cpp" %}
{% highlight cpp linenos %}
#define LOCTEXT_NAMESPACE "FTargetPracticeRoundEditorViewportClient"
// ...
void FTargetPracticeRoundEditorViewportClient::TrackingStarted(const FInputEventState& InInputState, bool bIsDraggingWidget, bool bNudge)
{
	if (!bManipulating && bIsDraggingWidget)
	{
		// ...
		FText TransactionText;
		if (GetWidgetMode() == FWidget::WM_Rotate)
		{
			TransactionText = LOCTEXT("RotateTarget", "Rotate Target(s)");
		}
		else if (GetWidgetMode() == FWidget::WM_Scale)
		{
			TransactionText = LOCTEXT("ScaleTarget", "Scale Target(s)");
		}
		else if (GetWidgetMode() == FWidget::WM_Translate)
		{
			TransactionText = LOCTEXT("TranslateTarget", "Translate Target(s)");
		}

		GEditor->BeginTransaction(TransactionText);
		TargetPracticeRound->Modify();
	}
}

void FTargetPracticeRoundEditorViewportClient::TrackingStopped()
{
	if (bManipulating)
	{
		// ...
		GEditor->EndTransaction();
	}
}
// ...
#undef LOCTEXT_NAMESPACE
{% endhighlight %}

And that's it! An important thing to know about undo/redo transactions,
`UObject::Modify` must called on an object *before* it is changed. This
function makes an object include itself in a transaction, so any changes
made prior to it will not be accounted for. It is important to make sure that
the `RF_Transactional` flag is set on the object so that it's properties are
included in the transaction. Otherwise, only the existence of the object is
tracked and nothing will change unless the object is deleted during the
transaction.

[![][img4]][img4]{: data-lightbox="img4"}

# Duplication

The last interaction that a user would expect with a viewport in Unreal is
the ability to duplicate an object by alt-dragging. This functionality is
handled in `TrackingStarted`, by making a copy of the selection to leave
behind before dragging the selection around the world.

Within the context of our asset, it would make sense to only duplicate targets
in their own waves, so we will do just that. The new targets are appended to
the end of the arrays, so none of our selection indices will be invalidated.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditorViewportClient.cpp" %}
{% highlight cpp linenos %}
void FTargetPracticeRoundEditorViewportClient::TrackingStarted(const FInputEventState& InInputState, bool bIsDraggingWidget, bool bNudge)
{
	if (!bManipulating && bIsDraggingWidget)
	{
		// ...
		else if (GetWidgetMode() == FWidget::WM_Translate)
		{
			// ...
			if (InInputState.IsLeftMouseButtonPressed() && (Widget->GetCurrentAxis() & EAxisList::XYZ))
			{
				const bool bAltDown = InInputState.IsAltButtonPressed();
				if (bAltDown)
				{
					// Rather than moving/rotating the selected primitives, copy them and move the copies instead
					TargetPracticeRoundEditorPtr.Pin()->DuplicateSelectedTargets();
				}
			}
		}
		// ...
	}
}
{% endhighlight %}

This interaction will be set up as it's own transaction but could be rolled
into the main transaction with a little adjustment. Note the use of
`FScopedTranscation`. This is a newer addition to Unreal that begins and ends
a transaction using a constructor and destructor, respectively. A lot of the
engine has not yet moved to it yet, so if you are referencing engine code,
consider switching over in your implementation. This has many benefits when a
transaction is encapsulated in a single function, primarily that
early-returning will not leave a transaction hanging.

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.h" %}
{% highlight cpp linenos %}
class FTargetPracticeRoundEditor : public FAssetEditorToolkit, public FGCObject, public FEditorUndoClient
{
public:
	// ...
	void DuplicateSelectedTargets();
	// ...
};
{% endhighlight %}

{% include highlight-caption.html wb="/" caption="/Source/BeyondDataAssetEditor/AssetEditors/TargetPracticeRoundEditor.h" %}
{% highlight cpp linenos %}
void FTargetPracticeRoundEditor::DuplicateSelectedTargets()
{
	{
		FScopedTransaction Transaction(LOCTEXT("DuplicateTargets", "Duplicate Target(s)"));
		EditingTargetPracticeRound->Modify();

		for (const auto& TargetIndex : SelectedTargets)
		{
			TArray<FTarget>& TargetArray = EditingTargetPracticeRound->Waves[TargetIndex.WaveIndex].Targets;

			FTarget NewTarget = TargetArray[TargetIndex.TargetIndex];
			TargetArray.Add(NewTarget);
		}
	}

	EditingTargetPracticeRound->MarkPackageDirty();

	FPropertyChangedEvent ChangeEvent(nullptr);
	EditingTargetPracticeRound->PostEditChangeProperty(ChangeEvent);
}
{% endhighlight %}

{% include video.html src="/img/unreal/BeyondDataAsset/TargetDuplication.webm" %}

------------------------------------------------------------------------------

In part 5, we will extend the AssetEditor toolbars, add new tabs with custom
Slate widgets, and explore UI Commands and keyboard shortcuts.

[img1]: /img/unreal/BeyondDataAsset/WidgetLocalCoord.png "Local Widget Coordinate Space"
[img2]: /img/unreal/BeyondDataAsset/ViewportToolbar.png "Standard Viewport Toolbar"
[img3]: /img/unreal/BeyondDataAsset/WidgetGlobalCoord.png "Global Widget Coordinate Space"
[img4]: /img/unreal/BeyondDataAsset/WidgetUndoText.png "Undo Notification"