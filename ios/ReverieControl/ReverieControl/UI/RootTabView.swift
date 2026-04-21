import SwiftUI

struct RootTabView: View {
    var body: some View {
        TabView {
            ControlView()
                .tabItem { Label("Control", systemImage: "bed.double") }
            MassageView()
                .tabItem { Label("Masaje", systemImage: "waveform") }
            ScheduleListView()
                .tabItem { Label("Horarios", systemImage: "clock") }
            SettingsView()
                .tabItem { Label("Ajustes", systemImage: "gear") }
        }
    }
}
